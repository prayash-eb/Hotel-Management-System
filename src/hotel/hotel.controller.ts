import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFiles, Query, ForbiddenException, ParseFilePipe } from '@nestjs/common';
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
import RejectHotelReasonDTO from './dto/reject-hotel.dto';
import DeleteHotelMediaDTO from './dto/delete-hotel-media.dto';

@Controller('hotel')
export class HotelController {
  constructor(private readonly hotelService: HotelService) { }

  @Post()
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async create(@GetUser() user: UserDocument, @Body() createHotelDto: CreateHotelDTO) {
    if (!user.isEmailVerified) {
      throw new ForbiddenException("Please verify your email first")
    }
    return await this.hotelService.create(user._id.toHexString(), createHotelDto);
  }

  @Get()
  async findAll(@Query() query: HotelQueryDTO) {
    return await this.hotelService.findAll(query);
  }

  @Get("/all")
  async findAllHotels() {
    return await this.hotelService.findAllHotels();
  }

  @Get("/mine")
  @UseGuards(JwtAccessGuard)
  async findByHotels(@GetUser() user: UserDocument) {
    return await this.hotelService.findMyHotels(user._id.toHexString())
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.hotelService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async update(@Param('id') hotelId: string, @GetUser() user: UserDocument, @Body() updateHotelDto: UpdateHotelDTO) {
    return await this.hotelService.update(hotelId, user._id.toHexString(), updateHotelDto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async activate(@Param('id') hotelId: string, @GetUser() user: UserDocument) {
    return await this.hotelService.activateHotel(hotelId, user._id.toHexString());
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async deactivate(@Param('id') hotelId: string, @GetUser() user: UserDocument) {
    return await this.hotelService.deactivateHotel(hotelId, user._id.toHexString());
  }


  @Patch(":id/approve")
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async approveHotelByAdmin(@Param("id", ParseObjectIdPipe) hotelId: string) {
    return await this.hotelService.approveHotel(hotelId)
  }

  @Patch(":id/reject")
  @Roles(UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async rejectHotelByAdmin(@Param("id", ParseObjectIdPipe) hotelId: string, @Body() body: RejectHotelReasonDTO) {
    return await this.hotelService.rejectHotel(hotelId, body.reason)
  }

  @Post(':id/images')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadMedias(
    @Param('id') hotelId: string,
    @GetUser() user: UserDocument,
    @UploadedFiles(new ParseFilePipe(), FileValidationPipe) files: Array<Express.Multer.File>
  ) {
    return await this.hotelService.uploadMedias(hotelId, user._id.toHexString(), files);
  }
  
  @Delete(":id/images")
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async deleteMedias(
    @Param("id") hotelId: string,
    @GetUser() user: UserDocument,
    @Body() body: DeleteHotelMediaDTO
  ) {
    return await this.hotelService.deleteMedias(hotelId, user._id.toHexString(), body.medias)
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  async deleteHotel(@Param('id') hotelId: string, @GetUser() user: UserDocument) {
    return await this.hotelService.delete(hotelId, user._id.toHexString(), user.role);
  }
}
