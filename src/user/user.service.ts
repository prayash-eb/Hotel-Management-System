import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUserAddress, User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDTO } from '../auth/dtos/create-user.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { hashToken } from '../utils/hash';
import { toObjectId } from '../utils/object-id.util';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(createUserDto: CreateUserDTO): Promise<UserDocument> {
    this.logger.log(`Creating user with email: ${createUserDto.email}`);
    const user = await this.userModel.create({
      ...createUserDto,
    });
    this.logger.log(`User ${user._id} created successfully`);
    return user;
  }
  async findByEmail(email: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOne({ email });
    return user || null;
  }

  async findById(id: string): Promise<UserDocument | null> {
    const userObjectId = toObjectId(id, 'userId');
    const user = await this.userModel.findById(userObjectId);
    return user || null;
  }
  async findAll(): Promise<UserDocument[]> {
    return await this.userModel.find({});
  }
  async update(id: string, updateUserDto: UpdateUserDTO): Promise<UserDocument> {
    this.logger.log(`Updating user ${id}`);

    const userObjectId = toObjectId(id, 'userId');
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userObjectId,
      {
        ...updateUserDto,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User ${id} updated successfully`);
    return updatedUser;
  }
  async updateProfile(id: string, file?: Express.Multer.File): Promise<UserDocument> {
    this.logger.log(`Updating profile for user ${id}`);

    let avatarUrl: string | undefined;
    let avatarPublicId: string | undefined;

    if (file) {
      const uploadResult = await this.cloudinaryService.uploadMedia(file, 'profile_images');
      avatarUrl = uploadResult.secure_url;
      avatarPublicId = uploadResult.public_id;
    }

    const userObjectId = toObjectId(id, 'userId');
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userObjectId,
      {
        ...(avatarUrl && { avatar: avatarUrl }),
        ...(avatarPublicId && { avatarPublicId }),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`Profile updated for user ${id}`);
    return updatedUser;
  }
  async remove(id: string): Promise<UserDocument> {
    this.logger.log(`Deleting user ${id}`);

    const userObjectId = toObjectId(id, 'userId');
    const deletedUser = await this.userModel.findByIdAndDelete(userObjectId);

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`User ${id} deleted successfully`);
    return deletedUser;
  }
  async updateAddress(id: string, address: IUserAddress): Promise<UserDocument> {
    this.logger.log(`Updating address for user ${id}`);

    const userObjectId = toObjectId(id, 'userId');
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userObjectId,
      {
        $set: {
          address: address,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.logger.log(`Address updated for user ${id}`);
    return updatedUser;
  }
  async findByEmailVerificationToken(verificationToken: string): Promise<UserDocument | null> {
    const verificationTokenHash = hashToken(verificationToken);
    return await this.userModel.findOne({
      emailVerificationToken: verificationTokenHash,
      emailVerificationTokenExpiry: {
        $gt: new Date(Date.now()),
      },
    });
  }
  async findByResetToken(tokenHash: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordTokenExpiry: { $gt: new Date() },
    });
  }
}
