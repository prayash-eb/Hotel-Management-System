import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateHotelDTO } from './dto/create-hotel.dto';
import { UpdateHotelDTO } from './dto/update-hotel.dto';
import { Model, Types } from 'mongoose';
import { Hotel, HotelDocument } from './schemas/hotel.schema';
import { InjectModel } from '@nestjs/mongoose';
import { HotelQueryDTO } from './dto/hotel-query.dto';
import { Menu } from '../menu/schemas/menu.schema';
import { UserRole } from '../user/schema/user.schema';
import { toObjectId } from '../utils/object-id.util';
import { HotelAuthorizationService } from './services/hotel-authorization.service';
import { HotelMediaService } from './services/hotel-media.service';
import { HotelApprovalService } from './services/hotel-approval.service';

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @InjectModel(Hotel.name) private readonly hotelModel: Model<Hotel>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    private readonly authorizationService: HotelAuthorizationService,
    private readonly mediaService: HotelMediaService,
    private readonly approvalService: HotelApprovalService,
  ) {}

  async create(ownerId: Types.ObjectId, createHotelDto: CreateHotelDTO): Promise<Hotel> {
    this.logger.log(`Creating hotel for owner ${ownerId}`);

    const { address, ...rest } = createHotelDto;
    const hotelData: any = {
      ownerId,
      ...rest,
    };

    if (address) {
      hotelData.address = {
        street: address.street,
        city: address.city,
        location: {
          type: 'Point',
          coordinates: [address.location.longitude, address.location.latitude],
        },
      };
    }

    const hotel = await this.hotelModel.create(hotelData);
    this.logger.log(`Hotel ${hotel._id} created successfully`);
    return hotel;
  }

  async findAll(query: HotelQueryDTO) {
    const { search, city, page = 1, limit = 10, latitude, longitude, radius } = query;
    const match: any = { isActive: true, 'approval.status': 'approved' };

    if (search) {
      match.hotelName = { $regex: search, $options: 'i' };
    }

    if (city) {
      match['address.city'] = { $regex: city, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    let aggregationPipeline: any[] = [];

    if (latitude && longitude) {
      const maxDistanceInMeters = (radius || 20) * 1000; // Default 10km

      aggregationPipeline.push({
        $geoNear: {
          near: { type: 'Point', coordinates: [longitude, latitude] },
          distanceField: 'distance',
          spherical: true,
          maxDistance: maxDistanceInMeters,
          key: 'address.location', // required for nested fields
          query: match, // apply other filters
        },
      });
    } else {
      aggregationPipeline.push({ $match: match });
    }

    aggregationPipeline.push({ $skip: skip });
    aggregationPipeline.push({ $limit: limit });

    const hotels = await this.hotelModel.aggregate(aggregationPipeline);
    const total = await this.hotelModel.countDocuments(match);

    return {
      hotels,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllHotels() {
    return await this.hotelModel.find({});
  }

  async findOne(hotelId: string): Promise<HotelDocument> {
    return await this.authorizationService.findHotelById(hotelId);
  }

  async findMyHotels(ownerId: Types.ObjectId) {
    return await this.hotelModel.find({
      ownerId,
    });
  }

  async deactivateHotel(hotelId: string, ownerId: string): Promise<HotelDocument> {
    const hotel = await this.authorizationService.verifyOwnership(hotelId, ownerId);
    return await this.approvalService.deactivateHotel(hotel);
  }

  async activateHotel(hotelId: string, ownerId: Types.ObjectId): Promise<HotelDocument> {
    const hotel = await this.authorizationService.verifyOwnership(hotelId, ownerId);
    return await this.approvalService.activateHotel(hotel);
  }

  async approveHotel(hotelId: string): Promise<HotelDocument> {
    const hotel = await this.authorizationService.findHotelById(hotelId);
    return await this.approvalService.approveHotel(hotel);
  }

  async rejectHotel(hotelId: string, reason: string): Promise<HotelDocument> {
    const hotel = await this.authorizationService.findHotelById(hotelId);
    return await this.approvalService.rejectHotel(hotel, reason);
  }

  async update(
    hotelId: string,
    ownerId: string,
    updateHotelDto: UpdateHotelDTO,
  ): Promise<HotelDocument> {
    this.logger.log(`Updating hotel ${hotelId} for owner ${ownerId}`);

    // Verify ownership first
    await this.authorizationService.verifyOwnership(hotelId, ownerId);

    const { address, ...rest } = updateHotelDto;
    const updateData: any = { ...rest };

    if (address) {
      updateData.address = {
        street: address.street,
        city: address.city,
        location: {
          type: 'Point',
          coordinates: [address.location.longitude, address.location.latitude],
        },
      };
    }

    const hotelObjectId = toObjectId(hotelId, 'hotelId');
    const ownerObjectId = toObjectId(ownerId, 'ownerId');
    const updatedHotel = await this.hotelModel.findOneAndUpdate(
      {
        _id: hotelObjectId,
        ownerId: ownerObjectId,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedHotel) {
      throw new NotFoundException('Hotel not found or you are not the owner');
    }

    this.logger.log(`Hotel ${hotelId} updated successfully`);
    return updatedHotel;
  }

  async delete(hotelId: string, ownerId: string, role: UserRole): Promise<{ message: string }> {
    this.logger.log(`Deleting hotel ${hotelId} by ${role}`);

    const hotelObjectId = toObjectId(hotelId, 'hotelId');
    const ownerObjectId = toObjectId(ownerId, 'ownerId');

    if (role === 'admin') {
      const deletedHotel = await this.hotelModel.findOneAndDelete({
        _id: hotelObjectId,
      });
      if (!deletedHotel) {
        throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
      }
    }

    if (role === 'hotel_owner') {
      const deletedHotel = await this.hotelModel.findOneAndDelete({
        _id: hotelObjectId,
        ownerId: ownerObjectId,
      });
      if (!deletedHotel) {
        throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
      }
    }

    // Delete all associated menus
    await this.menuModel.deleteMany({ hotelId: hotelObjectId });

    this.logger.log(`Hotel ${hotelId} and associated menus deleted successfully`);
    return { message: 'Hotel and associated menus deleted successfully' };
  }

  async uploadMedias(
    hotelId: string,
    ownerId: string,
    files: Express.Multer.File[],
  ): Promise<HotelDocument> {
    const hotel = await this.authorizationService.verifyOwnership(hotelId, ownerId);
    return await this.mediaService.uploadMedia(hotel, files);
  }

  async deleteMedias(
    hotelId: string,
    ownerId: string,
    publicIds: string[],
  ): Promise<HotelDocument> {
    const hotel = await this.authorizationService.verifyOwnership(hotelId, ownerId);
    return await this.mediaService.deleteMedia(hotel, publicIds);
  }
}
