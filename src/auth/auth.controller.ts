import { Body, Controller, Get, Post, Query, Req, UploadedFile, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UserLoginDTO } from './dtos/user-login.dto';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { JwtAccessGuard, JwtRefreshGuard } from './guards/jwt.guard';
import { RoleGuard } from './guards/role.guard';
import { Roles } from './decorators/role.decorator';
import { type UserDocument, UserRole } from '../user/schema/user.schema';
import { GetUser } from './decorators/get-user.decorator';
import type { Request } from 'express';
import { ChangePasswordDTO, ForgotPasswordDTO, ResetPasswordDTO } from './dtos/password.dto';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  @UseInterceptors(FileInterceptor('avatar'))
  async signUpUser(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() body: CreateUserDTO,
  ) {
    return await this.authService.signUp(body, file);
  }

  @Post('/signin')
  async signInUser(@Body() body: UserLoginDTO) {
    const { accessToken, refreshToken } = await this.authService.signIn(body);
    return {
      message: 'Logged in successfully',
      accessToken,
      refreshToken,
    };
  }
  @Get('/refresh-token')
  @UseGuards(JwtRefreshGuard) // attaches req.user = {user, refreshToken}
  async refreshUserToken(@GetUser() userInfo: { user: UserDocument; refreshToken: string }) {
    const { user, refreshToken } = userInfo;
    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(
      user,
      refreshToken,
    );

    return {
      message: 'Token Refresh Successfully',
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  @Get('/logout')
  @UseGuards(JwtAccessGuard)
  async logoutUser(@GetUser() user: UserDocument, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader ? authHeader.split('Bearer ')[1] : '';
    await this.authService.logout(user, accessToken);
    return {
      message: 'Logged out successfully',
      id: user._id,
    };
  }

  @Get('/logoutall')
  @UseGuards(JwtAccessGuard)
  async logoutAllDevices(@GetUser() user: UserDocument, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const accessToken = authHeader ? authHeader.split('Bearer ')[1] : '';
    await this.authService.logoutAll(user, accessToken);
    return {
      message: 'Logged out all devices successfully',
      id: user._id,
    };
  }

  @Post('/send-verification-link')
  @UseGuards(JwtAccessGuard)
  async sendVerificationLink(@GetUser() user: UserDocument) {
    await this.authService.sendVerificationLink(user);
    return {
      message: 'Verification Link sent to an email',
    };
  }

  @Get('/verify-email')
  async verifyEmail(@Query('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      message: 'Email Verified Successfully',
    };
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() body: ForgotPasswordDTO) {
    return await this.authService.forgotPassword(body);
  }

  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordDTO) {
    return await this.authService.resetPassword(body);
  }

  @Post('/change-password')
  @UseGuards(JwtAccessGuard)
  async changePassword(@GetUser() user: UserDocument, @Body() body: ChangePasswordDTO) {
    return await this.authService.changePassword(user, body);
  }
}
