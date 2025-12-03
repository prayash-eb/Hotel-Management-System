import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDTO, DeliveryAddressDTO } from './dto/create-order.dto';
import { UpdateOrderStatusDTO } from './dto/update-order-status.dto';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { Menu, MenuDocument } from '../menu/schemas/menu.schema';
import { Hotel, HotelDocument } from '../hotel/schemas/hotel.schema';
import { UserDocument, UserRole } from '../user/schema/user.schema';
import { OrderEventsService } from './order-events.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>,
    @InjectModel(Hotel.name) private readonly hotelModel: Model<HotelDocument>,
    private readonly orderEvents: OrderEventsService,
  ) { }

  async createOrder(user: UserDocument, dto: CreateOrderDTO) {
    const activeMenu = await this.menuModel.findOne({ hotelId: new Types.ObjectId(dto.hotelId), isActive: true });
    if (!activeMenu) {
      throw new NotFoundException('Active menu not found for the selected hotel');
    }

    const normalizedItems = dto.items.map((item) => {
      if (!Types.ObjectId.isValid(item.id)) {
        throw new BadRequestException(`Invalid menu item id: ${item.id}`);
      }

      const menuItem = this.findMenuItem(activeMenu, item.id);
      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Menu item ${item.id} is unavailable`);
      }

      const lineTotal = menuItem.price * item.quantity;
      const menuItemObjectId = new Types.ObjectId(item.id);
      return {
        id: menuItemObjectId,
        name: menuItem.name,
        description: menuItem.description,
        unitPrice: menuItem.price,
        quantity: item.quantity,
        lineTotal,
        notes: item.notes,
        images: menuItem.media ?? [],
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalAmount = subtotal; // Placeholder for delivery/tax computations

    const fulfillmentType = dto.fulfillmentType ?? 'delivery';
    if (fulfillmentType === 'delivery' && !dto.deliveryAddress) {
      throw new BadRequestException('Delivery address is required for delivery orders');
    }

    const deliveryAddress = dto.deliveryAddress
      ? this.buildDeliveryAddress(dto.deliveryAddress)
      : undefined;

    const statusTimeline = [
      { status: OrderStatus.PENDING, timestamp: new Date(), notes: 'Order placed by customer' },
    ];

    const order = await this.orderModel.create({
      hotelId: new Types.ObjectId(dto.hotelId),
      customerId: user._id,
      customerName: user.name,
      customerPhone: dto.customerPhone,
      items: normalizedItems,
      subtotal,
      totalAmount,
      status: OrderStatus.PENDING,
      statusTimeline,
      fulfillmentType,
      deliveryAddress,
      paymentStatus: PaymentStatus.PENDING,
    });

    this.orderEvents.emit(order._id.toString(), this.buildEventPayload(order, 'created'));
    return order;
  }

  async listCustomerOrders(user: UserDocument) {
    return this.orderModel
      .find({ customerId: user._id })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getOrderById(orderId: string, user: UserDocument) {
    const orderObjectId = new Types.ObjectId(orderId)
    const order = await this.orderModel.findById(orderObjectId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!(await this.canViewOrder(order, user))) {
      throw new ForbiddenException('You are not allowed to access this order');
    }

    return order;
  }

  async updateOrderStatus(orderId: string, user: UserDocument, dto: UpdateOrderStatusDTO) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!(await this.canManageOrder(order, user))) {
      throw new ForbiddenException('You are not allowed to update this order');
    }

    order.status = dto.status;
    order.statusTimeline.push({
      status: dto.status,
      timestamp: new Date(),
      notes: dto.notes,
      updatedBy: user._id,
    });

    if (dto.estimatedReadyTime) {
      order.estimatedReadyTime = new Date(dto.estimatedReadyTime);
    }
    if (dto.estimatedDeliveryTime) {
      order.estimatedDeliveryTime = new Date(dto.estimatedDeliveryTime);
    }

    await order.save();

    const payload = this.buildEventPayload(order, 'status-update');
    if (payload) {
      this.orderEvents.emit(order._id.toString(), payload);
    }
    return order;
  }

  async streamOrder(orderId: string, user: UserDocument) {
    const order = await this.getOrderById(orderId, user);
    const stream = this.orderEvents.getStream(orderId, this.buildEventPayload(order, 'snapshot'));
    return stream
  }

  private async canViewOrder(order: OrderDocument, user: UserDocument) {
    if (order.customerId.toString() === user._id.toString()) {
      return true;
    }
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    return this.isHotelOwner(order.hotelId, user._id);
  }

  private async canManageOrder(order: OrderDocument, user: UserDocument) {
    if (user.role === UserRole.ADMIN) {
      return true;
    }
    if (user.role === UserRole.HOTEL_OWNER) {
      return this.isHotelOwner(order.hotelId, user._id);
    }
    return false;
  }

  private async isHotelOwner(hotelId: Types.ObjectId, ownerId: Types.ObjectId) {
    const hotel = await this.hotelModel.findOne({ _id: hotelId, ownerId });
    return Boolean(hotel);
  }

  private findMenuItem(menu: MenuDocument, menuItemId: string) {
    for (const category of menu.categories) {
      const item = category.items.find((entry) => {
        const entryId = (entry as any)._id?.toString();
        return entryId === menuItemId;
      });
      if (item) {
        return item;
      }
    }
    return null;
  }

  private buildDeliveryAddress(address: DeliveryAddressDTO | undefined) {
    if (!address) {
      return undefined;
    }
    return {
      street: address.street,
      city: address.city,
      instructions: address.instructions,
      location: address.coordinates
        ? {
          type: 'Point' as const,
          coordinates: address.coordinates,
        }
        : undefined,
    };
  }

  private buildEventPayload(order: OrderDocument, type: string) {
    if (!order) return null;

    const updatedAt = new Date();

    return {
      type,
      orderId: order._id?.toString() ?? null,
      status: order.status ?? null,
      statusTimeline: (order.statusTimeline ?? []).map((timeline) => ({
        status: timeline.status ?? null,
        timestamp: timeline.timestamp ?? null,
        notes: timeline.notes ?? null,
        updatedBy: timeline.updatedBy ?? null,
      })),
      totalAmount: order.totalAmount ?? 0,
      paymentStatus: order.paymentStatus ?? null,
      estimatedReadyTime: order.estimatedReadyTime ?? null,
      estimatedDeliveryTime: order.estimatedDeliveryTime ?? null,
      fulfillmentType: order.fulfillmentType ?? null,
      updatedAt,
    };
  }

}
