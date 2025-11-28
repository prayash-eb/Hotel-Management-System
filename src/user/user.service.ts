import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';
import { CreateUserDTO } from '../auth/dtos/create-user.dto';
import { UpdateUserDTO } from './dtos/update-user.dto';

@Injectable()
export class UserService {
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

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
        })

        if (!updatedUser) {
            throw new Error("Error while updating user")
        }
    }
    async remove(id: string) {
        const deletedUser = await this.userModel.findByIdAndDelete(id)
        if (!deletedUser) {
            throw new Error("Error while deleting a user")
        }
    }
}
