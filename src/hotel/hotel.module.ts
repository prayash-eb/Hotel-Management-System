import { Module } from '@nestjs/common';
import { HotelService } from './hotel.service';
import { HotelController } from './hotel.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Hotel, HotelSchema } from './schemas/hotel.schema';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

import { Menu, MenuSchema } from '../menu/schemas/menu.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hotel.name, schema: HotelSchema },
      { name: Menu.name, schema: MenuSchema }
    ]),
    UserModule,
    AuthModule
  ],
  controllers: [HotelController],
  providers: [HotelService],
})
export class HotelModule { }
