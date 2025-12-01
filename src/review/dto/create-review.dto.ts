import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateReviewDTO {
  @IsNotEmpty()
  @IsString()
  hotelId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  @IsString()
  comment: string;
}
