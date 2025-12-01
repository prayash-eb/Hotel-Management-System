import { Body, Controller, ForbiddenException, NotFoundException, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { Get, Patch, Delete } from '@nestjs/common';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { FileValidationPipe } from '../auth/pipes/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { type UserDocument } from './schema/user.schema';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
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
    const updatedUser = await this.userService.updateProfile(user._id.toHexString(), file)
  }

  @Delete()
  async removeUserById(@GetUser() user: UserDocument) {
    const deletedUser = await this.userService.remove(user._id.toHexString())
    return {
      message: "User deleted successfully",
      id: deletedUser._id
    }
  }
}
