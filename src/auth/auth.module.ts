import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { CloudinaryService } from './cloudinary.service';

@Module({
  imports: [UserModule, PassportModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService, CloudinaryService, FileValidationPipe],
})
export class AuthModule { }
