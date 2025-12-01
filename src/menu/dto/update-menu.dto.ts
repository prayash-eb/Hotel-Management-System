import { PartialType } from '@nestjs/mapped-types';
import { CreateMenuDTO } from './create-menu.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateMenuDTO extends PartialType(CreateMenuDTO) {
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
