import { OrderStatus } from '../schemas/order.schema';

export interface OrderEventPayload {
  type: string;
  orderId: string;
  status: OrderStatus;
  estimatedReadyTime?: Date;
  estimatedDeliveryTime?: Date;
  fulfillmentType: 'delivery' | 'pickup' | 'dine_in';
  latestUpdate: {
    status: OrderStatus;
    timestamp: Date;
    notes?: string;
  } | null;
  timestamp: Date;
}
