import { Module, Global } from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { LoggingModule } from './logging/logging.module';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [CloudinaryService, LoggingInterceptor],
  exports: [CloudinaryService, LoggingInterceptor, LoggingModule],
})
export class CommonModule {}
