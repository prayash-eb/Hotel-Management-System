import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppLoggerService } from '../logging/logger.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (!context.switchToHttp) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request & { requestId?: string; user?: any }>();
    const response = httpContext.getResponse<Response>();
    const { method, url, ip, headers } = request;
    const requestId = request?.requestId;
    const userAgent = headers['user-agent'];
    const userId = request.user?._id || request.user?.id;
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Date.now() - startedAt;
          const statusCode = response?.statusCode;
          const logLevel = statusCode >= 400 ? 'warn' : 'log';

          this.logger[logLevel](
            {
              type: 'http',
              message: 'HTTP request completed',
              method,
              url,
              statusCode,
              durationMs,
              requestId,
              userId,
              ip,
              userAgent,
            },
            'HTTP',
          );
        },
        error: (err) => {
          const durationMs = Date.now() - startedAt;

          this.logger.error(
            {
              type: 'http',
              message: 'HTTP request failed',
              method,
              url,
              statusCode: err?.status || response?.statusCode || 500,
              durationMs,
              requestId,
              userId,
              ip,
              userAgent,
              errorName: err?.name,
              errorMessage: err?.message,
            },
            err?.stack,
            'HTTP',
          );
        },
      }),
    );
  }
}
