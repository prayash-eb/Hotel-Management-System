import { Injectable } from '@nestjs/common';
import { DeliveryAddressDTO } from '../dto/create-order.dto';
import { OrderDocument } from '../schemas/order.schema';
import { OrderEventPayload } from '../interfaces/order-event-payload.interface';
import { OrderEventType } from '../constants/order-event-types';

@Injectable()
export class OrderHelperService {
  /**
   * Build delivery address object from DTO
   */
  buildDeliveryAddress(address: DeliveryAddressDTO | undefined) {
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

  /**
   * Build SSE event payload for order status updates
   */
  buildEventPayload(order: OrderDocument, eventType: OrderEventType): OrderEventPayload | null {
    if (!order) return null;

    const latestTimeline = order.statusTimeline?.[order.statusTimeline.length - 1];

    return {
      type: eventType,
      orderId: order._id.toString(),
      status: order.status,
      estimatedReadyTime: order.estimatedReadyTime,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      fulfillmentType: order.fulfillmentType,
      latestUpdate: latestTimeline
        ? {
            status: latestTimeline.status,
            timestamp: latestTimeline.timestamp,
            notes: latestTimeline.notes,
          }
        : null,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate order totals
   */
  calculateTotals(items: Array<{ lineTotal: number }>) {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    // Add tax/delivery fees calculation here if needed
    const totalAmount = subtotal;

    return { subtotal, totalAmount };
  }
}
