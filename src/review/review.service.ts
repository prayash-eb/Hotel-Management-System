import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateReviewDTO } from './dto/create-review.dto';
import { Review, ReviewDocument } from './schemas/review.schema';
import { Hotel, HotelDocument } from '../hotel/schemas/hotel.schema';
import { UserDocument } from '../user/schema/user.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
  ) {}

  async create(user: UserDocument, createReviewDto: CreateReviewDTO) {
    const { hotelId, rating, comment } = createReviewDto;

    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    const review = await this.reviewModel.create({
      hotelId: new Types.ObjectId(hotelId),
      customerId: user._id,
      customerName: user.name,
      rating,
      comment,
    });

    await this.updateHotelStats(hotelId, hotel.hotelName);

    return review;
  }

  async updateHotelStats(hotelId: string, hotelName: string) {
    const stats = await this.reviewModel.aggregate([
      { $match: { hotelId: new Types.ObjectId(hotelId) } },
      {
        $group: {
          _id: '$hotelId',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    // Get top 3 recent reviews
    const recentReviews = await this.reviewModel
      .find({ hotelId: new Types.ObjectId(hotelId) })
      .sort({ createdAt: -1 })
      .limit(3)
      .exec();

    const topReviews = recentReviews.map((review) => ({
      reviewId: review._id,
      customerId: review.customerId,
      hotelName: hotelName,
      customerName: review.customerName,
      ratingScore: review.rating,
      reviewMessage: review.comment,
      createdAt: (review as any).createdAt,
      updatedAt: (review as any).updatedAt,
    }));

    await this.hotelModel.findByIdAndUpdate(hotelId, {
      rating: averageRating,
      totalReviews: totalReviews,
      topReviews: topReviews,
    });
  }

  async getHotelReviews(hotelId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const reviews = await this.reviewModel
      .find({ hotelId: new Types.ObjectId(hotelId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const total = await this.reviewModel.countDocuments({
      hotelId: new Types.ObjectId(hotelId),
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
