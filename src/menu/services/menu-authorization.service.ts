import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from '../../hotel/schemas/hotel.schema';
import { MenuDocument } from '../schemas/menu.schema';

@Injectable()
export class MenuAuthorizationService {
  constructor(@InjectModel(Hotel.name) private readonly hotelModel: Model<HotelDocument>) {}

  /**
   * Verify that the user owns the hotel
   */
  async verifyHotelOwnership(
    hotelId: Types.ObjectId,
    ownerId: Types.ObjectId,
  ): Promise<HotelDocument> {
    const hotel = await this.hotelModel.findOne({
      _id: hotelId,
      ownerId,
    });

    if (!hotel) {
      throw new NotFoundException('Hotel not found or you are not the owner');
    }

    return hotel;
  }

  /**
   * Verify that the user owns the hotel associated with the menu
   */
  async verifyMenuOwnership(menu: MenuDocument, ownerId: Types.ObjectId): Promise<void> {
    const hotel = await this.hotelModel.findOne({
      _id: menu.hotelId,
      ownerId,
    });

    if (!hotel) {
      throw new ForbiddenException('You are not the owner of the hotel this menu belongs to');
    }
  }
}
