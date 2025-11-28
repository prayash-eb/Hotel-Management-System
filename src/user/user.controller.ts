import { Body, Controller, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { Get, Post, Patch, Delete } from '@nestjs/common';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get()
  async findAllUsers() {
    return await this.userService.findAll();
  }

  @Get(":id")
  async findUserById(@Param("id", ParseObjectIdPipe) id: string) {
    return await this.userService.findById(id)
  }

  @Patch(":id")
  async updateUserById(@Param("id", ParseObjectIdPipe) id: string, @Body() body: UpdateUserDTO) {
    return await this.userService.update(id, body)
  }

  @Delete(":id")
  async removeUserById(@Param("id", ParseObjectIdPipe) id: string) {
    return await this.userService.remove(id)
  }
}
