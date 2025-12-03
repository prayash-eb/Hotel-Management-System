import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { Menu, MenuSchema } from './schemas/menu.schema';
import { Hotel, HotelSchema } from '../hotel/schemas/hotel.schema';
import { UserModule } from '../user/user.module';
import { AuthModule } from '../auth/auth.module';
import { MenuAuthorizationService } from './services/menu-authorization.service';
import { MenuCategoryService } from './services/menu-category.service';
import { MenuItemService } from './services/menu-item.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Menu.name, schema: MenuSchema },
      { name: Hotel.name, schema: HotelSchema },
    ]),
    UserModule,
    AuthModule,
    CommonModule,
  ],
  controllers: [MenuController],
  providers: [MenuService, MenuAuthorizationService, MenuCategoryService, MenuItemService],
})
export class MenuModule {}
