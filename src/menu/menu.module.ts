import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { Menu, MenuSchema } from './schemas/menu.schema';
import { Hotel, HotelSchema } from '../hotel/schemas/hotel.schema';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Menu.name, schema: MenuSchema },
      { name: Hotel.name, schema: HotelSchema },
    ]),
    UserModule,
    AuthModule
  ],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
