import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { Review, ReviewSchema } from './schemas/review.schema';
import { HotelModule } from '../hotel/hotel.module';
import { Hotel, HotelSchema } from '../hotel/schemas/hotel.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Hotel.name, schema: HotelSchema },
    ]),
    HotelModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
