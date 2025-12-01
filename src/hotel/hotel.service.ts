import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHotelDTO } from './dto/create-hotel.dto';
import { UpdateHotelDTO } from './dto/update-hotel.dto';
import { Model } from 'mongoose';
import { Hotel } from './schemas/hotel.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { HotelQueryDTO } from './dto/hotel-query.dto';
import { Menu } from '../menu/schemas/menu.schema';

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

    return await this.hotelModel.create(hotelData);
  }

  async findAll(query: HotelQueryDTO) {
    const { search, city, page = 1, limit = 10, latitude, longitude, radius } = query;
    const filter: any = { isActive: true }; // Only show active hotels by default

    if (search) {
      filter.hotelName = { $regex: search, $options: 'i' };
    }

    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    if (latitude && longitude) {
      const maxDistanceInMeters = (radius || 10) * 1000; // Default 10km
      filter['address.location'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: maxDistanceInMeters
        }
      };
    }

    const skip = (page - 1) * limit;

    const [hotels, total] = await Promise.all([
      this.hotelModel.find(filter).skip(skip).limit(limit).exec(),
      this.hotelModel.countDocuments(filter).exec()
    ]);

    return {
      data: hotels,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(hotelId: string) {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) throw new NotFoundException('Hotel not found');
    return hotel;
  }

  async findMyHotels(ownerId: string) {
    return await this.hotelModel.find({
      ownerId
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
      { _id: hotelId, ownerId },
      { $set: { isActive: true } },
      { new: true }
    );
    if (!hotel) throw new NotFoundException('Hotel not found or you are not the owner');
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

  async remove(id: string) {
    const deletedHotel = await this.hotelModel.findByIdAndDelete(id);
    if (!deletedHotel) {
      throw new NotFoundException(`Hotel with ID ${id} not found`);
    }

    // Delete all associated menus
    await this.menuModel.deleteMany({ hotelId: id });

    return { message: 'Hotel and associated menus deleted successfully' };
  }

  async uploadImages(hotelId: string, ownerId: string, files: Express.Multer.File[]) {
    const hotel = await this.hotelModel.findOne({ _id: hotelId, ownerId });
    if (!hotel) throw new NotFoundException('Hotel not found or you are not the owner');

    const uploadPromises = files.map(file => this.cloudinaryService.uploadImage(file));
    const results = await Promise.all(uploadPromises);
    
    const newMedia = results.map(result => ({
        type: 'image',
        label: 'Hotel Image',
        link: result.secure_url
    }));

    hotel.media.push(...newMedia);
    await hotel.save();
    return hotel;
  }
}
