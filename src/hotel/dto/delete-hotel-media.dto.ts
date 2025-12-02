import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export default class DeleteHotelMediaDTO {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  medias: string[];
}
