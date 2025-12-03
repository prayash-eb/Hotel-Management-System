import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

interface StreamItem {
  subject: Subject<any>;
  subscribersCount: number;
}

@Injectable()
export class OrderEventsService {
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

      // Send initial payload if exists
      if (initialPayload) {
        subscriber.next({ data: initialPayload });
      }

      // Subscribe to live updates
      const subscription = streamItem.subject.subscribe({
        next: (payload) => {
          if (payload) subscriber.next({ data: payload });
        },
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });

      // Cleanup on unsubscribe
      return () => {
        subscription.unsubscribe();
        streamItem.subscribersCount--;

        // Delete stream if no subscribers left
        if (streamItem.subscribersCount === 0) {
          this.streams.delete(orderId);
        }
      };
    });
  }

  /**
   * Emits a payload to all clients subscribed to this order
   */
  emit(orderId: string, payload: any) {
    if (!payload) return; // prevent undefined payloads
    const streamItem = this.getOrCreateStream(orderId);
    streamItem.subject.next(payload);
  }
}
