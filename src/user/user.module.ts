import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from '../auth/cloudinary.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [
    UserController
  ],
  providers: [UserService, CloudinaryService],
  exports: [UserService]
})
export class UserModule { }
