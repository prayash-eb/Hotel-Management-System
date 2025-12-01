import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { buildLoggerOptions } from './logger.config';
import { AppLoggerService } from './logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => buildLoggerOptions(configService),
    }),
  ],
  providers: [AppLoggerService],
  exports: [AppLoggerService],
})
export class LoggingModule {}
