import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export const buildLoggerOptions = (configService: ConfigService): WinstonModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const logDir = configService.get<string>('LOG_DIR') ?? 'logs';
  const level = nodeEnv === 'production' ? 'info' : 'debug';

  return {
    level,
    transports: [
      new winston.transports.Console({
        level: 'error',
        handleExceptions: true,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.ms(),
          nestWinstonModuleUtilities.format.nestLike('HotelManagement', {
            colors: nodeEnv !== 'production',
            prettyPrint: nodeEnv !== 'production',
          })
        ),
      }),
      new winston.transports.DailyRotateFile({
        dirname: logDir,
        filename: '%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: nodeEnv === 'production' ? '30d' : '14d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      }),
    ],
  };
};
