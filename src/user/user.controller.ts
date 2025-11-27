import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { Get, Post, Patch, Delete } from '@nestjs/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }
  @Get()
  async findAll() {
    const users = await this.userService.findAll()
    return {
      message: "Users fetched successfully",
      users
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userService.update(id, updateUserDto);
    if (!user) {
      throw new BadRequestException("Error while updating user")

    }
    return {
      message: "User updated successfully",
      user
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userService.remove(id)
    return {
      message: "User deleted successfully",
      id
    }
  }
}
