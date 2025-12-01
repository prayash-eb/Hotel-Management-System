import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDTO {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  estimatedReadyTime?: string;

  @IsOptional()
  @IsISO8601()
  estimatedDeliveryTime?: string;
}
