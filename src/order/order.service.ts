import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { toObjectId } from '../utils/object-id.util';
import { CreateOrderDTO } from './dto/create-order.dto';
import { UpdateOrderStatusDTO } from './dto/update-order-status.dto';
import { Order, OrderDocument, OrderStatus, PaymentStatus } from './schemas/order.schema';
import { UserDocument } from '../user/schema/user.schema';
import { OrderEventsService } from './order-events.service';
import { OrderValidationService } from './services/order-validation.service';
import { OrderAuthorizationService } from './services/order-authorization.service';
import { OrderHelperService } from './services/order-helper.service';
import { OrderEventType } from './constants/order-event-types';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly orderEvents: OrderEventsService,
    private readonly validationService: OrderValidationService,
    private readonly authorizationService: OrderAuthorizationService,
    private readonly helperService: OrderHelperService,
  ) {}

  async createOrder(user: UserDocument, dto: CreateOrderDTO): Promise<OrderDocument> {
    const hotelObjectId = toObjectId(dto.hotelId, 'hotelId');

    // Validate menu items and get normalized items
    const normalizedItems = await this.validationService.validateAndNormalizeItems(
      hotelObjectId,
      dto,
    );

    // Calculate totals
    const { subtotal, totalAmount } = this.helperService.calculateTotals(normalizedItems);

    // Validate delivery requirements
    const fulfillmentType = dto.fulfillmentType ?? 'delivery';
    this.validationService.validateDeliveryRequirements(fulfillmentType, dto.deliveryAddress);

    // Build delivery address if provided
    const deliveryAddress = this.helperService.buildDeliveryAddress(dto.deliveryAddress);

    // Create order
    const order = await this.orderModel.create({
      hotelId: hotelObjectId,
      customerId: user._id,
      customerName: user.name,
      customerPhone: dto.customerPhone,
      items: normalizedItems,
      subtotal,
      totalAmount,
      status: OrderStatus.PENDING,
      statusTimeline: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          notes: 'Order placed by customer',
        },
      ],
      fulfillmentType,
      deliveryAddress,
      paymentStatus: PaymentStatus.PENDING,
    });

    // Emit order created event
    const payload = this.helperService.buildEventPayload(order, OrderEventType.CREATED);
    if (payload) {
      this.orderEvents.emit(order._id.toString(), payload);
    }

    this.logger.log(`Order created: ${order._id} by customer: ${user._id}`);
    return order;
  }

  async listCustomerOrders(user: UserDocument): Promise<OrderDocument[]> {
    return this.orderModel.find({ customerId: user._id }).sort({ createdAt: -1 }).exec();
  }

  async getOrderById(orderId: string, user: UserDocument): Promise<OrderDocument> {
    const orderObjectId = toObjectId(orderId, 'orderId');
    const order = await this.orderModel.findById(orderObjectId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.authorizationService.canViewOrder(order, user);
    return order;
  }

  async updateOrderStatus(
    orderId: string,
    user: UserDocument,
    dto: UpdateOrderStatusDTO,
  ): Promise<OrderDocument> {
    const orderObjectId = toObjectId(orderId, 'orderId');
    const order = await this.orderModel.findById(orderObjectId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.authorizationService.canManageOrder(order, user);

    // Update order status
    order.status = dto.status;
    order.statusTimeline.push({
      status: dto.status,
      timestamp: new Date(),
      notes: dto.notes,
      updatedBy: user._id,
    });

    // Update estimated times if provided
    if (dto.estimatedReadyTime) {
      order.estimatedReadyTime = new Date(dto.estimatedReadyTime);
    }
    if (dto.estimatedDeliveryTime) {
      order.estimatedDeliveryTime = new Date(dto.estimatedDeliveryTime);
    }

    await order.save();

    // Emit status update event
    const payload = this.helperService.buildEventPayload(order, OrderEventType.STATUS_UPDATE);
    if (payload) {
      this.orderEvents.emit(order._id.toString(), payload);
      this.logger.log(`Order ${order._id} status updated to ${dto.status} by ${user._id}`);
    }

    return order;
  }

  async streamOrder(orderId: string, user: UserDocument) {
    // Validate orderId and check permissions
    const order = await this.getOrderById(orderId, user);

    // Build initial snapshot payload
    const initialPayload = this.helperService.buildEventPayload(order, OrderEventType.SNAPSHOT);

    // Return stream with initial state - use order._id.toString() to ensure string
    this.logger.log(`SSE stream opened for order ${order._id} by user ${user._id}`);
    return this.orderEvents.getStream(order._id.toString(), initialPayload);
  }
}
