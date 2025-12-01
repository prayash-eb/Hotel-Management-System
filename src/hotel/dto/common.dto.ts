import { IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, Min, Max, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaDTO {
    @IsEnum(['image', 'video'])
    type: 'image' | 'video';

    @IsString()
    @IsNotEmpty()
    label: string;

    @IsString()
    @IsNotEmpty()
    link: string;
}

export class LocationDTO {
    @IsNumber()
    longitude: number;

    @IsNumber()
    latitude: number;
}

export class AddressDTO {
    @ValidateNested()
    @Type(() => LocationDTO)
    location: LocationDTO;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    city: string;
}

export class TopReviewDTO {
    @IsMongoId() 
    reviewId: string;

    @IsMongoId()
    customerId: string;

    @IsString()
    hotelName: string;

    @IsString()
    customerName: string;

    @IsNumber()
    @Min(0)
    @Max(5)
    ratingScore: number;

    @IsString()
    reviewMessage: string;

    @IsOptional()
    @IsDate()
    createdAt?: Date;

    @IsOptional()
    @IsDate()
    updatedAt?: Date;
}