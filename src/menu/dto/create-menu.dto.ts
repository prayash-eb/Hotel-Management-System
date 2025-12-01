import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

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

    @IsEnum(['veg', 'non-veg', 'vegan'])
    type: 'veg' | 'non-veg' | 'vegan';

    @IsBoolean()
    @IsOptional()
    isAvailable?: boolean;
}

export class MenuCategoryDTO {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MenuItemDTO)
    items: MenuItemDTO[];
}

export class CreateMenuDTO {
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
