import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDTO } from './create-menu.dto';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateMenuDTO extends PartialType(CreateMenuDTO) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean
}
