import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hotel, HotelDocument } from '../schemas/hotel.schema';

@Injectable()
export class HotelApprovalService {
  private readonly logger = new Logger(HotelApprovalService.name);

  constructor(@InjectModel(Hotel.name) private readonly hotelModel: Model<Hotel>) {}

  /**
   * Approve a hotel by admin
   */
  async approveHotel(hotel: HotelDocument): Promise<HotelDocument> {
    this.logger.log(`Approving hotel ${hotel._id}`);

    hotel.approval.status = 'approved';
    await hotel.save();

    this.logger.log(`Hotel ${hotel._id} approved successfully`);
    return hotel;
  }

  /**
   * Reject a hotel by admin with reason
   */
  async rejectHotel(hotel: HotelDocument, reason: string): Promise<HotelDocument> {
    this.logger.log(`Rejecting hotel ${hotel._id} with reason: ${reason}`);

    hotel.approval.status = 'rejected';
    hotel.approval.reason = reason;
    await hotel.save();

    this.logger.log(`Hotel ${hotel._id} rejected successfully`);
    return hotel;
  }

  /**
   * Activate a hotel (owner action)
   */
  async activateHotel(hotel: HotelDocument): Promise<HotelDocument> {
    this.logger.log(`Activating hotel ${hotel._id}`);

    hotel.isActive = true;
    await hotel.save();

    this.logger.log(`Hotel ${hotel._id} activated successfully`);
    return hotel;
  }

  /**
   * Deactivate a hotel (owner action)
   */
  async deactivateHotel(hotel: HotelDocument): Promise<HotelDocument> {
    this.logger.log(`Deactivating hotel ${hotel._id}`);

    hotel.isActive = false;
    await hotel.save();

    this.logger.log(`Hotel ${hotel._id} deactivated successfully`);
    return hotel;
  }
}
