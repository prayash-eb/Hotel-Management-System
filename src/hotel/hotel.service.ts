import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHotelDTO } from './dto/create-hotel.dto';
import { UpdateHotelDTO } from './dto/update-hotel.dto';
import { Model } from 'mongoose';
import { Hotel } from './schemas/hotel.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class HotelService {
  constructor(
    @InjectModel(Hotel.name) private readonly hotelModel: Model<Hotel>

  ) { }

  async create(ownerId: string, createHotelDto: CreateHotelDTO) {
    return await this.hotelModel.create({
      ownerId,
      ...createHotelDto
    })
  }

  async findAll() {
    return await this.hotelModel.find({})
  }


  async findOne(hotelId: string) {
    return await this.hotelModel.findById(hotelId)
  }

  async findMyHotels(ownerId: string) {
    return await this.hotelModel.find({
      ownerId
    })
  }

  async deactivateHotel(hotelId: string) {
    await this.hotelModel.findByIdAndUpdate(hotelId, {
      $set: {
        isActive: false
      }
    })
  }

  async activateHotel(hotelId: string) {
    await this.hotelModel.findByIdAndUpdate(hotelId, {
      $set: {
        isActive: true
      }
    })
  }

  async update(hotelId: string, ownerId: string, updateHotelDto: UpdateHotelDTO) {
    const updatedHotel = await this.hotelModel.findOneAndUpdate({
      _id: hotelId,
      ownerId,
    }, {
      ...updateHotelDto
    }, {
      new: true,
      runValidators: true
    })

    return updatedHotel
  }

  async remove(hotelId: string) {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException({
        message: "Hotel Not Found"
      })
    }
    // also delete associated menu for that hotel
    await hotel.deleteOne()
  }
}
