import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IUserAddress, User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDTO } from '../auth/dtos/create-user.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';
import { CloudinaryService } from '../auth/cloudinary.service';
import { hashToken } from '../utils/hash';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    async create(createUserDto: CreateUserDTO) {
        try {
            return await this.userModel.create({
                ...createUserDto
            })
        } catch (error) {
            throw new Error(error)
        }
    }
    async findByEmail(email: string): Promise<UserDocument | null> {
        const user = await this.userModel.findOne({ email })
        if (!user) return null;
        return user;
    }
    async findById(id: string) {
        const user = await this.userModel.findById(id);
        if (!user) return null;
        return user
    }
    async findAll() {
        return await this.userModel.find({})
    }
    async update(id: string, updateUserDto: UpdateUserDTO) {
        const updatedUser = await this.userModel.findByIdAndUpdate(id, {
            ...updateUserDto
        }, {
            new: true,
            runValidators: true
        })

        if (!updatedUser) {
            throw new Error("Error while updating user")
        }
        return updatedUser
    }
    async updateProfile(id: string, file?: Express.Multer.File) {
        let avatarUrl: string | undefined;

        if (file) {
            const uploadResult = await this.cloudinaryService.uploadImage(file);
            avatarUrl = uploadResult.secure_url;
        }

        const updatedUser = await this.userModel.findByIdAndUpdate(
            id,
            {
                ...(avatarUrl && { avatar: avatarUrl }) // only update avatar if it exists
            },
            {
                new: true,
                runValidators: true
            }
        );

        return updatedUser;
    }
    async remove(id: string) {
        const deletedUser = await this.userModel.findByIdAndDelete(id, {
            new: true
        })
        if (!deletedUser) {
            throw new Error("Error while deleting a user")
        }
        return deletedUser
    }
    async updateAddress(id: string, address: IUserAddress) {
        return await this.userModel.findByIdAndUpdate(id, {
            $set: {
                address: address
            }
        }, {
            new: true,
            runValidators: true
        })
    }
    async findByEmailVerificationToken(verificationToken: string): Promise<UserDocument | null> {
        const verificationTokenHash = hashToken(verificationToken);
        return await this.userModel.findOne({
            emailVerificationToken: verificationTokenHash,
            emailVerificationTokenExpiry: {
                $gt: new Date(Date.now())
            }
        })

    }
}
