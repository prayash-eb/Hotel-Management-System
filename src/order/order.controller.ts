import { Body, Controller, Get, Param, Patch, Post, Sse, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDTO } from './dto/create-order.dto';
import { UpdateOrderStatusDTO } from './dto/update-order-status.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { type UserDocument, UserRole } from '../user/schema/user.schema';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  createOrder(@GetUser() user: UserDocument, @Body() dto: CreateOrderDTO) {
    return this.orderService.createOrder(user, dto);
  }

  @Get('mine')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  listMyOrders(@GetUser() user: UserDocument) {
    return this.orderService.listCustomerOrders(user);
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  getOrder(
    @Param('id', ParseObjectIdPipe) id: string,
    @GetUser() user: UserDocument,
  ) {
    return this.orderService.getOrderById(id, user);
  }

  @Patch(':id/status')
  @Roles(UserRole.HOTEL_OWNER, UserRole.ADMIN)
  @UseGuards(JwtAccessGuard, RoleGuard)
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @GetUser() user: UserDocument,
    @Body() dto: UpdateOrderStatusDTO,
  ) {
    return this.orderService.updateOrderStatus(id, user, dto);
  }

  @Sse(':id/events')
  @UseGuards(JwtAccessGuard)
  streamOrder(
    @Param('id', ParseObjectIdPipe) id: string,
    @GetUser() user: UserDocument,
  ): Promise<Observable<MessageEvent>> {
    return this.orderService.streamOrder(id, user);
  }
}
