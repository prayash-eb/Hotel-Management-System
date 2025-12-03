import { Controller, Post, Body, UseGuards, Get, Param, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDTO } from './dto/create-review.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { UserRole, type UserDocument } from '../user/schema/user.schema';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  create(@GetUser() user: UserDocument, @Body() createReviewDto: CreateReviewDTO) {
    return this.reviewService.create(user, createReviewDto);
  }

  @Get('hotel/:hotelId')
  getHotelReviews(
    @Param('hotelId', ParseObjectIdPipe) hotelId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewService.getHotelReviews(hotelId, page, limit);
  }
}
