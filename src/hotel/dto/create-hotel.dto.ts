import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaDTO, TopReviewDTO, AddressDTO } from './common.dto';

export class CreateHotelDTO {
  
    @IsString()
    @IsNotEmpty()
    hotelName: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MediaDTO)
    @IsOptional()
    media?: MediaDTO[];

    @ValidateNested()
    @Type(() => AddressDTO)
    @IsOptional()
    address: AddressDTO;
}
