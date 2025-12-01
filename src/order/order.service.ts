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
  ) {}

  async createOrder(user: UserDocument, dto: CreateOrderDTO) {
    const activeMenu = await this.menuModel.findOne({ hotelId: dto.hotelId, isActive: true });
    if (!activeMenu) {
      throw new NotFoundException('Active menu not found for the selected hotel');
    }

    const normalizedItems = dto.items.map((item) => {
      if (!Types.ObjectId.isValid(item.menuItemId)) {
        throw new BadRequestException(`Invalid menu item id: ${item.menuItemId}`);
      }

      const menuItem = this.findMenuItem(activeMenu, item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Menu item ${item.menuItemId} is unavailable`);
      }

      const lineTotal = menuItem.price * item.quantity;
      const menuItemObjectId = new Types.ObjectId(item.menuItemId);
      return {
        menuItemId: menuItemObjectId,
        name: menuItem.name,
        description: menuItem.description,
        unitPrice: menuItem.price,
        quantity: item.quantity,
        lineTotal,
        notes: item.notes,
        images: menuItem.images ?? [],
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
      orderNumber: this.generateOrderNumber(),
      items: normalizedItems,
      subtotal,
      totalAmount,
      status: OrderStatus.PENDING,
      statusTimeline,
      fulfillmentType,
      deliveryAddress,
      specialInstructions: dto.specialInstructions,
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
    const order = await this.orderModel.findById(orderId);
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

    this.orderEvents.emit(order._id.toString(), this.buildEventPayload(order, 'status-update'));
    return order;
  }

  async streamOrder(orderId: string, user: UserDocument) {
    const order = await this.getOrderById(orderId, user);
    return this.orderEvents.getStream(orderId, this.buildEventPayload(order, 'snapshot'));
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

  private generateOrderNumber() {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  private buildEventPayload(order: OrderDocument, type: string) {
    const updatedAt = (order as any).updatedAt ?? new Date();
    return {
      type,
      orderId: order._id.toString(),
      status: order.status,
      statusTimeline: order.statusTimeline.map((timeline) => ({
        status: timeline.status,
        timestamp: timeline.timestamp,
        notes: timeline.notes,
        updatedBy: timeline.updatedBy,
      })),
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      estimatedReadyTime: order.estimatedReadyTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      fulfillmentType: order.fulfillmentType,
      updatedAt,
    };
  }
}
