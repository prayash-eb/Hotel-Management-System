import { BadRequestException, Body, Controller, Post, UploadedFile, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UserLoginDTO } from './dtos/user-login.dto';
import { UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from './cloudinary.service';
import { FileValidationPipe } from './pipes/file-validation.pipe';

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
    const uploadFileResult = file ? await this.cloudinaryService.uploadImage(file) : null

    const user = await this.authService.signUp({
      ...body,
      avatar: uploadFileResult?.secure_url ?? null
    })
    return {
      message: "User created successfully",
      user
    }
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
}
