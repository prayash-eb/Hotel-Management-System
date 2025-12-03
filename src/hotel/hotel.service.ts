import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHotelDTO } from './dto/create-hotel.dto';
import { UpdateHotelDTO } from './dto/update-hotel.dto';
import { Model, Types } from 'mongoose';
import { Hotel } from './schemas/hotel.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { HotelQueryDTO } from './dto/hotel-query.dto';
import { Menu } from '../menu/schemas/menu.schema';
import { UserRole } from '../user/schema/user.schema';

@Injectable()
export class HotelService {
  constructor(
    @InjectModel(Hotel.name) private readonly hotelModel: Model<Hotel>,
    @InjectModel(Menu.name) private readonly menuModel: Model<Menu>,
    private readonly cloudinaryService: CloudinaryService
  ) { }

  async create(ownerId: string, createHotelDto: CreateHotelDTO) {
    const { address, ...rest } = createHotelDto;
    const hotelData: any = {
      ownerId: new Types.ObjectId(ownerId),
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

    return await this.hotelModel.create(hotelData);
  }

  async findAll(query: HotelQueryDTO) {
    const { search, city, page = 1, limit = 10, latitude, longitude, radius } = query;
    const match: any = { isActive: true, "approval.status": "approved" };

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
          query: match // apply other filters
        }
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
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findAllHotels() {
    return await this.hotelModel.find({})
  }

  async findOne(hotelId: string) {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async findMyHotels(ownerId: string) {
    return await this.hotelModel.find({
      ownerId: new Types.ObjectId(ownerId)
    })
  }

  async deactivateHotel(hotelId: string, ownerId: string) {
    const hotel = await this.hotelModel.findOneAndUpdate(
      { _id: hotelId, ownerId },
      { $set: { isActive: false } },
      { new: true }
    );
    if (!hotel) throw new NotFoundException('Hotel not found or you are not the owner');
    return hotel;
  }

  async activateHotel(hotelId: string, ownerId: string) {
    const hotel = await this.hotelModel.findOneAndUpdate(
      { _id: hotelId, ownerId: new Types.ObjectId(ownerId) },
      { $set: { isActive: true } },
      { new: true }
    );
    if (!hotel) throw new NotFoundException('Hotel not found or you are not the owner');
    return hotel;
  }

  async approveHotel(hotelId: string) {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException("Hotel not found")
    }
    hotel.approval.status = "approved";
    await hotel.save()
    return hotel
  }

  async rejectHotel(hotelId: string, reason: string) {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException("Hotel not found");
    }

    hotel.approval.status = "rejected";
    hotel.approval.reason = reason;
    await hotel.save();

    return hotel;
  }

  async update(hotelId: string, ownerId: string, updateHotelDto: UpdateHotelDTO) {
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

    const updatedHotel = await this.hotelModel.findOneAndUpdate({
      _id: hotelId,
      ownerId,
    }, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedHotel) {
      throw new NotFoundException('Hotel not found or you are not the owner');
    }

    return updatedHotel
  }

  async delete(hotelId: string, ownerId: string, role: UserRole) {
    if (role === "admin") {
      const deletedHotel = await this.hotelModel.findOneAndDelete({
        _id: hotelId
      });
      if (!deletedHotel) {
        throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
      }
    }

    if (role === "hotel_owner") {
      const deletedHotel = await this.hotelModel.findOneAndDelete({
        _id: hotelId,
        ownerId
      });
      if (!deletedHotel) {
        throw new NotFoundException(`Hotel with ID ${hotelId} not found`);
      }
    }

    // Delete all associated menus
    await this.menuModel.deleteMany({ hotelId });

    return { message: 'Hotel and associated menus deleted successfully' };
  }

  async uploadMedias(hotelId: string, ownerId: string, files: Express.Multer.File[]) {
    const hotel = await this.hotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) throw new NotFoundException('Hotel not found or you are not the owner');

    const uploadPromises = files.map(file => this.cloudinaryService.uploadMedia(file, "hotel_images"));
    const results = await Promise.all(uploadPromises);

    const newMedia = results.map(result => ({
      type: 'image',
      label: 'Hotel Image',
      link: result.secure_url,
      publicId: result.public_id
    }));

    hotel.media.push(...newMedia);
    await hotel.save();
    return hotel;
  }

  async deleteMedias(hotelId: string, ownerId: string, publicIds: string[]) {
    // Find the hotel and verify ownership
    const hotel = await this.hotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) throw new NotFoundException('Hotel not found or you are not the owner');

    // Filter the media that actually exist
    const existingMedia = hotel.media.filter(m => publicIds.includes(m.publicId));
    if (existingMedia.length === 0) {
      throw new NotFoundException('No matching images found to delete');
    }

    // Delete images from Cloudinary in parallel
    const deletePromises = existingMedia.map(m => this.cloudinaryService.deleteMedia(m.publicId));
    await Promise.all(deletePromises);

    // Remove deleted media from the hotel's media array
    hotel.media = hotel.media.filter(m => !publicIds.includes(m.publicId));

    await hotel.save();
    return hotel;
  }
}
