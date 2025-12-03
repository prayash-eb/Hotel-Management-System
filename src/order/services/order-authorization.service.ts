import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from '../../hotel/schemas/hotel.schema';
import { UserDocument, UserRole } from '../../user/schema/user.schema';
import { OrderDocument } from '../schemas/order.schema';

@Injectable()
export class OrderAuthorizationService {
  constructor(@InjectModel(Hotel.name) private readonly hotelModel: Model<HotelDocument>) {}

  /**
   * Check if user can view the order
   */
  async canViewOrder(order: OrderDocument, user: UserDocument): Promise<void> {
    // Customer can view their own orders
    if (order.customerId.toString() === user._id.toString()) {
      return;
    }

    // Admin can view all orders
    if (user.role === UserRole.ADMIN) {
      return;
    }

    // Hotel owner can view orders for their hotels
    if (await this.isHotelOwner(order.hotelId, user._id)) {
      return;
    }

    throw new ForbiddenException('You are not allowed to access this order');
  }

  /**
   * Check if user can manage (update) the order
   */
  async canManageOrder(order: OrderDocument, user: UserDocument): Promise<void> {
    // Admin can manage all orders
    if (user.role === UserRole.ADMIN) {
      return;
    }

    // Hotel owner can manage orders for their hotels
    if (user.role === UserRole.HOTEL_OWNER) {
      if (await this.isHotelOwner(order.hotelId, user._id)) {
        return;
      }
    }

    throw new ForbiddenException('You are not allowed to update this order');
  }

  private async isHotelOwner(hotelId: Types.ObjectId, ownerId: Types.ObjectId): Promise<boolean> {
    const hotel = await this.hotelModel.findOne({ _id: hotelId, ownerId });
    return Boolean(hotel);
  }
}
