import { Body, Controller, Get, Post, UploadedFile, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UserLoginDTO } from './dtos/user-login.dto';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';
import { JwtAccessGuard, JwtRefreshGuard } from './guards/jwt.guard';
import { RoleGuard } from './guards/role.guard';
import { Roles } from './decorators/role.decorator';
import { UserDocument, UserRole } from '../user/schema/user.schema';
import { GetUser } from './decorators/get-user.decorator';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  @Post("/signup")
  @UseInterceptors(FileInterceptor("avatar"))
  async signUpUser(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @Body() body: CreateUserDTO,
  ) {
    return await this.authService.signUp(body, file)
  }

  @Post("/signin")
  async signInUser(@Body() body: UserLoginDTO) {
    const { accessToken, refreshToken } = await this.authService.signIn(body)
    return {
      message: "Logged in successfully",
      accessToken,
      refreshToken
    }
  }
  @Get("/refresh-token")
  @UseGuards(JwtRefreshGuard) // attaches req.user = {user, refreshToken}
  async refreshUserToken(@GetUser() userInfo: { user: UserDocument, refreshToken: string }) {
    const { user, refreshToken } = userInfo;

    const { accessToken, refreshToken: newRefreshToken } = await this.authService.refreshToken(user, refreshToken)

    return {
      message: "Token Refresh Successfully",
      accessToken,
      refreshToken:newRefreshToken
    }
  }


}
