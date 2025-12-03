import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  COOKING = 'cooking',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })

  id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ min: 0 })
  lineTotal: number;

  @Prop()
  notes?: string;

  @Prop({ type: [String], default: [] })
  images: string[];
}

@Schema({ _id: false })
export class StatusTimeline {
  @Prop({ required: true, enum: OrderStatus })
  status: OrderStatus;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Types.ObjectId })
  updatedBy?: Types.ObjectId;
}

@Schema({ _id: false })
export class DeliveryAddress {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ type: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: undefined }
  } })
  location?: {
    type: 'Point';
    coordinates: [number, number];
  };
}

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Hotel', required: true, index: true })
  hotelId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  customerPhone: string;

  @Prop({ type: [OrderItem], default: [] })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ type: [StatusTimeline], default: [] })
  statusTimeline: StatusTimeline[];

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ default: 'delivery', enum: ['delivery', 'pickup', 'dine_in'] })
  fulfillmentType: 'delivery' | 'pickup' | 'dine_in';

  @Prop({ type: DeliveryAddress })
  deliveryAddress?: DeliveryAddress;

  @Prop()
  estimatedReadyTime?: Date;

  @Prop()
  estimatedDeliveryTime?: Date;

}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ hotelId: 1, status: 1 });
OrderSchema.index({ customerId: 1, createdAt: -1 });
