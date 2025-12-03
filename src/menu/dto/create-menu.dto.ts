import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Min, MinLength, ValidateNested } from 'class-validator';

export class MenuItemDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    price: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsEnum(['veg', 'non-veg', 'vegan'],{ message: 'type must be veg, non-veg, or vegan' })
    @IsOptional()
    type?: string;

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;
}

export class MenuCategoryDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description?: string;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => MenuItemDTO)
    items: MenuItemDTO[];
}

export class CreateMenuDTO {

    @IsMongoId()
    hotelId: string

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MenuCategoryDTO)
    @IsOptional()
    categories?: MenuCategoryDTO[];
}


export class MenuItemArrayDTO {
    @ValidateNested()
    @IsNotEmpty()
    @Type(() => MenuItemDTO)
    items: MenuItemDTO[]
}