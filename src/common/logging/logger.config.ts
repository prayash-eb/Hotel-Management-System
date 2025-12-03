import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

/**
 * Custom log levels with priorities
 * Lower numbers = higher priority
 */
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
  },
};

// Add colors to winston
winston.addColors(customLevels.colors);

/**
 * Custom format to add additional metadata to logs
 */
const customFormat = winston.format.printf(({ level, message, timestamp, context, trace, ...metadata }) => {
  let log = `${timestamp} [${level.toUpperCase()}] [${context || 'Application'}]`;
  
  if (typeof message === 'object') {
    log += ` ${JSON.stringify(message)}`;
  } else {
    log += ` ${message}`;
  }
  
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  
  if (trace) {
    log += `\n${trace}`;
  }
  
  return log;
});

/**
 * Build Winston logger configuration with separate log files for different purposes
 */
export const buildLoggerOptions = (configService: ConfigService): WinstonModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const logDir = configService.get<string>('LOG_DIR') ?? 'logs';
  const level = nodeEnv === 'production' ? 'info' : 'debug';
  const isProduction = nodeEnv === 'production';

  // Console format for development
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.ms(),
    winston.format.colorize({ all: true }),
    nestWinstonModuleUtilities.format.nestLike('HotelManagement', {
      colors: !isProduction,
      prettyPrint: !isProduction,
    }),
  );

  // File format with JSON for easy parsing
  const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.metadata(),
    winston.format.json(),
  );

  return {
    levels: customLevels.levels,
    level,
    transports: [
      // Console transport - show all logs in development, only errors in production
      new winston.transports.Console({
        level: isProduction ? 'error' : level,
        handleExceptions: true,
        format: consoleFormat,
      }),

      // Error logs - separate file for errors only
      new winston.transports.DailyRotateFile({
        dirname: path.join(logDir, 'errors'),
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: isProduction ? '90d' : '30d', // Keep errors longer
        format: fileFormat,
        handleExceptions: true,
        handleRejections: true,
      }),

      // Combined logs - all levels
      new winston.transports.DailyRotateFile({
        dirname: path.join(logDir, 'combined'),
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: isProduction ? '30d' : '14d',
        format: fileFormat,
      }),

      // HTTP logs - for API requests/responses
      new winston.transports.DailyRotateFile({
        dirname: path.join(logDir, 'http'),
        filename: 'http-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: isProduction ? '30d' : '14d',
        format: fileFormat,
      }),

      // Application logs - info and above (excluding http)
      new winston.transports.DailyRotateFile({
        dirname: path.join(logDir, 'app'),
        filename: 'app-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: isProduction ? '30d' : '14d',
        format: fileFormat,
      }),
    ],
    // Exception handlers
    exceptionHandlers: [
      new winston.transports.DailyRotateFile({
        dirname: path.join(logDir, 'exceptions'),
        filename: 'exceptions-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '90d',
        format: fileFormat,
      }),
    ],
    // Rejection handlers for unhandled promise rejections
    rejectionHandlers: [
      new winston.transports.DailyRotateFile({
        dirname: path.join(logDir, 'rejections'),
        filename: 'rejections-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '90d',
        format: fileFormat,
      }),
    ],
  };
};
