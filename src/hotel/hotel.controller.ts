import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, Query } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { CreateHotelDTO } from './dto/create-hotel.dto';
import { UpdateHotelDTO } from './dto/update-hotel.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { type UserDocument, UserRole } from '../user/schema/user.schema';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { HotelQueryDTO } from './dto/hotel-query.dto';

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
  findAll(@Query() query: HotelQueryDTO) {
    return this.hotelService.findAll(query);
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

  @Patch(':id/activate')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  activate(@Param('id') hotelId: string, @GetUser() user: UserDocument) {
    return this.hotelService.activateHotel(hotelId, user._id.toHexString());
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  deactivate(@Param('id') hotelId: string, @GetUser() user: UserDocument) {
    return this.hotelService.deactivateHotel(hotelId, user._id.toHexString());
  }

  @Post(':id/images')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  uploadImages(
    @Param('id') hotelId: string,
    @GetUser() user: UserDocument,
    @UploadedFiles(FileValidationPipe) files: Array<Express.Multer.File>
  ) {
    return this.hotelService.uploadImages(hotelId, user._id.toHexString(), files);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hotelService.remove(id);
  }
}
