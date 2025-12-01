import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OrderItemDTO {
  @IsNotEmpty()
  @IsString()
  menuItemId: string;

  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeliveryAddressDTO {
  @IsNotEmpty()
  @IsString()
  street: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(2)
  @Type(() => Number)
  coordinates?: [number, number];
}

export class CreateOrderDTO {
  @IsNotEmpty()
  @IsString()
  hotelId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDTO)
  items: OrderItemDTO[];

  @IsOptional()
  @IsIn(['delivery', 'pickup', 'dine_in'])
  fulfillmentType?: 'delivery' | 'pickup' | 'dine_in';

  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDTO)
  deliveryAddress?: DeliveryAddressDTO;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsNotEmpty()
  @IsString()
  customerPhone: string;
}
