import { PartialType, PickType } from '@nestjs/mapped-types';
import { MenuCategoryDTO } from './create-menu.dto';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDTO extends PickType(MenuCategoryDTO, ['name', "description"] as const) { }

export class CreateCategoryArrayDTO {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCategoryDTO)
    categories: CreateCategoryDTO[];
}

export class UpdateCategoryDTO extends PartialType(CreateCategoryDTO) { }
