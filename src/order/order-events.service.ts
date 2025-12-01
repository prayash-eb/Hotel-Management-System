import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Injectable()
export class OrderEventsService {
  private readonly streams = new Map<string, Subject<any>>();

  private getOrCreateStream(orderId: string): Subject<any> {
    let stream = this.streams.get(orderId);
    if (!stream) {
      stream = new Subject();
      this.streams.set(orderId, stream);
    }
    return stream;
  }

  getStream(orderId: string, initialPayload?: any): Observable<MessageEvent> {
    const stream = this.getOrCreateStream(orderId);
    return new Observable<MessageEvent>((subscriber) => {
      if (initialPayload) {
        subscriber.next({ data: initialPayload });
      }

      const subscription = stream.subscribe({
        next: (payload) => subscriber.next({ data: payload }),
        error: (err) => subscriber.error(err),
        complete: () => subscriber.complete(),
      });

      return () => {
        subscription.unsubscribe();
        const tracked = this.streams.get(orderId) as Subject<any> & { observers?: any[] };
        if (!tracked?.observers?.length) {
          this.streams.delete(orderId);
        }
      };
    });
  }

  emit(orderId: string, payload: any) {
    const stream = this.getOrCreateStream(orderId);
    stream.next(payload);
  }
}
