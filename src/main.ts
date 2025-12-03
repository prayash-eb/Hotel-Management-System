import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validateEnvironment } from './configs/env.validation';
import { AppLoggerService } from './common/logging/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HttpAdapterHost } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  app.use((req: Request & { requestId?: string }, res: Response, next: NextFunction) => {
    const headerId = req.headers['x-request-id'];
    const requestId = (Array.isArray(headerId) ? headerId[0] : headerId) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor(logger));

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost, logger));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
