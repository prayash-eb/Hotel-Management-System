import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsString } from 'class-validator';
import { MenuCategoryDTO } from './create-menu.dto';

export class CreateCategoryDTO extends PickType(MenuCategoryDTO, ['name'] as const) {}

export class UpdateCategoryDTO extends PartialType(CreateCategoryDTO) {}
