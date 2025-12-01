import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDTO } from './common.dto';

export class UpdateHotelDTO {
    @IsOptional()
    @IsString()
    hotelName?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => AddressDTO)
    address?: AddressDTO;

}