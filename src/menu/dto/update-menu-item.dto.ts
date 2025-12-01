import { PartialType } from '@nestjs/mapped-types';
import { MenuItemDTO } from './create-menu.dto';

export class UpdateMenuItemDTO extends PartialType(MenuItemDTO) {}
