import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy, JwtRefreshStrategy } from './strategy/jwt.strategy';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [UserModule, PassportModule, JwtModule, CommonModule],
  controllers: [AuthController],
  providers: [AuthService, JwtAccessStrategy, JwtRefreshStrategy],
  exports: [],
})
export class AuthModule {}
