import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested, Length } from 'class-validator';
import { Type } from 'class-transformer';
import { MediaDTO, AddressDTO } from './common.dto';

export class CreateHotelDTO {
  @IsString()
  @IsNotEmpty()
  hotelName: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Length(5, 1000)
  description?: string;

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
