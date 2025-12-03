import { Injectable, Logger } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

interface StreamItem {
  subject: Subject<any>;
  subscribersCount: number;
}

@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  // Map orderId -> stream info
  private readonly streams = new Map<string, StreamItem>();

  /**
   * Get or create a stream for a specific orderId
   */
  private getOrCreateStream(orderId: string): StreamItem {
    let stream = this.streams.get(orderId);
    if (!stream) {
      stream = { subject: new Subject<any>(), subscribersCount: 0 };
      this.streams.set(orderId, stream);
    }
    return stream;
  }

  /**
   * Returns an Observable<MessageEvent> for SSE
   * Sends initialPayload immediately if provided
   */
  getStream(orderId: string, initialPayload?: any): Observable<MessageEvent> {
    const streamItem = this.getOrCreateStream(orderId);

    return new Observable<MessageEvent>((subscriber) => {
      // Increment subscriber count
      streamItem.subscribersCount++;
      this.logger.log(
        `Client connected to order ${orderId}. Total subscribers: ${streamItem.subscribersCount}`,
      );

      // Send initial payload if exists
      if (initialPayload) {
        subscriber.next({ data: initialPayload });
        this.logger.log(`Sent initial payload to order ${orderId}`);
      }

      // Subscribe to live updates
      const subscription = streamItem.subject.subscribe({
        next: (payload) => {
          if (payload) {
            subscriber.next({ data: payload });
          }
        },
        error: (err) => {
          subscriber.error(err);
        },
        complete: () => {},
      });

      // Cleanup on unsubscribe
      return () => {
        subscription.unsubscribe();
        streamItem.subscribersCount--;
        this.logger.log(
          `Client disconnected from order ${orderId}. Remaining subscribers: ${streamItem.subscribersCount}`,
        );

        // Delete stream if no subscribers left
        if (streamItem.subscribersCount === 0) {
          this.streams.delete(orderId);
          this.logger.log(`Stream deleted for order ${orderId} (no subscribers)`);
        }
      };
    });
  }

  /**
   * Emits a payload to all clients subscribed to this order
   */
  emit(orderId: string, payload: any) {
    if (!payload) {
      this.logger.warn(`Attempted to emit null/undefined payload for order ${orderId}`);
      return;
    }

    const streamItem = this.streams.get(orderId);
    if (!streamItem) {
      this.logger.debug(`No active stream for order ${orderId}. Event type: ${payload.type}`);
      return;
    }

    this.logger.log(
      `Emitting ${payload.type} event to ${streamItem.subscribersCount} subscriber(s) for order ${orderId}`,
    );
    streamItem.subject.next(payload);
  }

  /**
   * Get statistics about active streams (for debugging)
   */
  getStats() {
    const stats = Array.from(this.streams.entries()).map(([orderId, stream]) => ({
      orderId,
      subscribers: stream.subscribersCount,
    }));

    return {
      totalStreams: this.streams.size,
      streams: stats,
    };
  }
}
