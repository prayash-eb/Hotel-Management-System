import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { CreateHotelDTO } from './dto/create-hotel.dto';
import { UpdateHotelDTO } from './dto/update-hotel.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { type UserDocument, UserRole } from '../user/schema/user.schema';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('hotel')
export class HotelController {
  constructor(private readonly hotelService: HotelService) { }

  @Post()
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  create(@GetUser() user: UserDocument, @Body() createHotelDto: CreateHotelDTO) {
    return this.hotelService.create(user._id.toHexString(), createHotelDto);
  }

  @Get()
  findAll() {
    return this.hotelService.findAll();
  }

  @Get("/mine")
  @UseGuards(JwtAccessGuard)
  findByHotels(@GetUser() user: UserDocument) {
    return this.hotelService.findMyHotels(user._id.toHexString())
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.hotelService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  update(@Param('id') hotelId: string, @GetUser() user: UserDocument, @Body() updateHotelDto: UpdateHotelDTO) {
    return this.hotelService.update(hotelId, user._id.toHexString(), updateHotelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hotelService.remove(id);
  }
}
