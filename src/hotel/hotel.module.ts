import { Module } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { HotelController } from './hotel.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Hotel, HotelSchema } from './schemas/hotel.schema';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';
import { Menu, MenuSchema } from '../menu/schemas/menu.schema';
import { HotelAuthorizationService } from './services/hotel-authorization.service';
import { HotelMediaService } from './services/hotel-media.service';
import { HotelApprovalService } from './services/hotel-approval.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: Menu.name, schema: MenuSchema },
    ]),
    UserModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [HotelController],
  providers: [HotelService, HotelAuthorizationService, HotelMediaService, HotelApprovalService],
})
export class HotelModule {}
