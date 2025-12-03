import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { AppLoggerService } from '../logging/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly logger: AppLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const context = host.switchToHttp();
    const request = context.getRequest<Request & { requestId?: string }>();
    const response = context.getResponse();

    const requestId = request?.requestId;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let responsePayload: Record<string, any> | string = message;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      responsePayload = exceptionResponse;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message ?? message;
        errorCode = (exceptionResponse as any).errorCode ?? exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message ?? message;
    }

    const responseBody = {
      statusCode: status,
      message,
      errorCode,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request),
      requestId,
    };

    this.logger.error(
      {
        ...responseBody,
        stack: exception instanceof Error ? exception.stack : undefined,
        details: typeof responsePayload === 'object' ? responsePayload : undefined,
      },
      exception instanceof Error ? exception.stack : undefined,
      'Exceptions',
    );

    httpAdapter.reply(response, responseBody, status);
  }
}
