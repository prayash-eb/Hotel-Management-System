import { Body, Controller, ForbiddenException, NotFoundException, Param, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Get, Patch, Delete } from '@nestjs/common';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { IUserAddress, type UserDocument, UserRole } from './schema/user.schema';
import { UserLocationDTO } from './dtos/update-user-location.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { RoleGuard } from '../auth/guards/role.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get("me")
  @UseGuards(JwtAccessGuard)
  getMe(@GetUser() user: UserDocument) {
    return user;
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async findAllUsers() {
    return await this.userService.findAll();
  }

  @Get(":id")
  async findUserById(@Param("id", ParseObjectIdPipe) id: string) {
    const user = await this.userService.findById(id)
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user
  }

  @Patch()
  @UseGuards(JwtAccessGuard)
  async updateUserById(@GetUser() user: UserDocument, @Body() body: UpdateUserDTO) {
    const updatedUser = await this.userService.update(user._id.toHexString(), body)
    return updatedUser;
  }

  @Patch("/avatar")
  @UseInterceptors(FileInterceptor("avatar"))
  async updateUserAvatar(
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
    @GetUser() user: UserDocument
  ) {
    return await this.userService.updateProfile(user._id.toHexString(), file)
  }

  @Delete()
  async removeUserById(@GetUser() user: UserDocument) {
    const deletedUser = await this.userService.remove(user._id.toHexString())
    return {
      message: "User deleted successfully",
      id: deletedUser._id
    }
  }

  @Patch("/address")
  @UseGuards(JwtAccessGuard)
  async updateUserLocation(@GetUser() user: UserDocument, @Body() body: UserLocationDTO) {
    const addressInfo: IUserAddress = {
      location: {
        type: "Point",
        coordinates: [body.longitude, body.latitude],
      },
      street: body.street,
      city: body.city
    }
    return await this.userService.updateAddress(user._id.toHexString(), addressInfo)
  }
}
