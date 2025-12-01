import { Inject, Injectable, type LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AppLoggerService implements LoggerService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  log(message: any, context?: string): void {
    this.logger.log(message, context);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error(message, trace, context);
  }

  warn(message: any, context?: string): void {
    this.logger.warn(message, context);
  }

  debug(message: any, context?: string): void {
    const debug = (this.logger as any).debug ?? this.logger.log.bind(this.logger);
    debug(message, context);
  }

  verbose(message: any, context?: string): void {
    const verbose = (this.logger as any).verbose ?? this.logger.log.bind(this.logger);
    verbose(message, context);
  }
}
