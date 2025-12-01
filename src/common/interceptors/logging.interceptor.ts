import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logging/logger.service';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!context.switchToHttp) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { requestId?: string }>();
    const response = httpContext.getResponse();
    const { method, url } = request;
    const requestId = request?.requestId;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(
            {
              message: 'HTTP request completed',
              method,
              url,
              statusCode: response?.statusCode,
              durationMs: Date.now() - startedAt,
              requestId,
            },
            'HTTP',
          );
        },
        error: (err) => {
          this.logger.error(
            {
              message: 'HTTP request failed',
              method,
              url,
              statusCode: response?.statusCode,
              durationMs: Date.now() - startedAt,
              requestId,
            },
            err?.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}
