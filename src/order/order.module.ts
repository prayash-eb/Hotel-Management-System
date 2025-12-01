import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Menu, MenuSchema } from '../menu/schemas/menu.schema';
import { Hotel, HotelSchema } from '../hotel/schemas/hotel.schema';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderEventsService } from './order-events.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Menu.name, schema: MenuSchema },
      { name: Hotel.name, schema: HotelSchema },
    ]),
  ],
  providers: [OrderService, OrderEventsService],
  controllers: [OrderController],
})
export class OrderModule {}
