import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Hotel, HotelDocument } from '../schemas/hotel.schema';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Injectable()
export class HotelMediaService {
  private readonly logger = new Logger(HotelMediaService.name);

  constructor(
    @InjectModel(Hotel.name) private readonly hotelModel: Model<Hotel>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Upload multiple media files to Cloudinary and attach to hotel
   */
  async uploadMedia(hotel: HotelDocument, files: Express.Multer.File[]): Promise<HotelDocument> {
    this.logger.log(`Uploading ${files.length} media files for hotel ${hotel._id}`);

    const uploadPromises = files.map((file) =>
      this.cloudinaryService.uploadMedia(file, 'hotel_images'),
    );
    const results = await Promise.all(uploadPromises);

    const newMedia = results.map((result) => ({
      type: 'image',
      label: 'Hotel Image',
      link: result.secure_url,
      publicId: result.public_id,
    }));

    hotel.media.push(...newMedia);
    await hotel.save();

    this.logger.log(`Successfully uploaded ${newMedia.length} media files for hotel ${hotel._id}`);
    return hotel;
  }

  /**
   * Delete multiple media files from Cloudinary and remove from hotel
   */
  async deleteMedia(hotel: HotelDocument, publicIds: string[]): Promise<HotelDocument> {
    this.logger.log(`Deleting ${publicIds.length} media files for hotel ${hotel._id}`);

    // Filter the media that actually exist
    const existingMedia = hotel.media.filter((m) => publicIds.includes(m.publicId));
    if (existingMedia.length === 0) {
      throw new NotFoundException('No matching images found to delete');
    }

    // Delete images from Cloudinary in parallel
    const deletePromises = existingMedia.map((m) => this.cloudinaryService.deleteMedia(m.publicId));
    await Promise.all(deletePromises);

    // Remove deleted media from the hotel's media array
    hotel.media = hotel.media.filter((m) => !publicIds.includes(m.publicId));
    await hotel.save();

    this.logger.log(
      `Successfully deleted ${existingMedia.length} media files for hotel ${hotel._id}`,
    );
    return hotel;
  }
}
