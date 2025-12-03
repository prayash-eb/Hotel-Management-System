import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from '../schemas/hotel.schema';
import { toObjectId } from '../../utils/object-id.util';

@Injectable()
export class HotelAuthorizationService {
  constructor(@InjectModel(Hotel.name) private readonly hotelModel: Model<Hotel>) {}

  /**
   * Verify hotel ownership by checking if the hotel exists and belongs to the owner
   */
  async verifyOwnership(hotelId: string, ownerId: Types.ObjectId | string): Promise<HotelDocument> {
    const hotelObjectId = toObjectId(hotelId, 'hotelId');
    const ownerObjectId = typeof ownerId === 'string' ? toObjectId(ownerId, 'ownerId') : ownerId;

    const hotel = await this.hotelModel.findOne({
      _id: hotelObjectId,
      ownerId: ownerObjectId,
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found or you are not the owner');
    }

    return hotel;
  }

  /**
   * Find hotel by ID without ownership verification
   */
  async findHotelById(hotelId: string): Promise<HotelDocument> {
    const hotelObjectId = toObjectId(hotelId, 'hotelId');
    const hotel = await this.hotelModel.findById(hotelObjectId);

    if (!hotel) {
      throw new NotFoundException('Hotel not found');
    }

    return hotel;
  }
}
