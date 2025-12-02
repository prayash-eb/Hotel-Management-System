import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDTO } from './dto/create-menu.dto';
import { UpdateMenuDTO } from './dto/update-menu.dto';
import { JwtAccessGuard } from '../auth/guards/jwt.guard';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { UserRole, type UserDocument } from '../user/schema/user.schema';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateMenuItemDTO } from './dto/update-menu-item.dto';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCategoryArrayDTO, CreateCategoryDTO, UpdateCategoryDTO } from './dto/category.dto';
import { MenuItemDTO } from './dto/create-menu.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) { }

  @Post(':hotelId')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  create(
    @Param('hotelId', ParseObjectIdPipe) hotelId: string,
    @GetUser() user: UserDocument,
    @Body() createMenuDto: CreateMenuDTO,
  ) {
    return this.menuService.create(hotelId, user._id.toHexString(), createMenuDto);
  }

  @Get('hotel/:hotelId')
  findAllByHotel(@Param('hotelId', ParseObjectIdPipe) hotelId: string) {
    return this.menuService.findAllByHotel(hotelId);
  }

  @Get('hotel/:hotelId/active')
  getActiveMenu(@Param('hotelId', ParseObjectIdPipe) hotelId: string) {
    return this.menuService.getActiveMenu(hotelId);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.menuService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @GetUser() user: UserDocument,
    @Body() updateMenuDto: UpdateMenuDTO,
  ) {
    return this.menuService.update(id, user._id.toHexString(), updateMenuDto);
  }

  @Delete(':id')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @GetUser() user: UserDocument
  ) {
    return this.menuService.remove(id, user._id.toHexString());
  }

  @Patch(':menuId/category/:categoryId/item/:itemId')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  updateMenuItem(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @Param('itemId', ParseObjectIdPipe) itemId: string,
    @GetUser() user: UserDocument,
    @Body() updateMenuItemDto: UpdateMenuItemDTO,
  ) {
    return this.menuService.updateMenuItem(menuId, categoryId, itemId, user._id.toHexString(), updateMenuItemDto);
  }

  @Post(':menuId/category/:categoryId/item/:itemId/image')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  @UseInterceptors(FileInterceptor('image'))
  uploadMenuItemImage(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @Param('itemId', ParseObjectIdPipe) itemId: string,
    @GetUser() user: UserDocument,
    @UploadedFile(FileValidationPipe) file: Express.Multer.File,
  ) {
    return this.menuService.uploadMenuItemImage(menuId, categoryId, itemId, user._id.toHexString(), file);
  }

  @Delete(':menuId/category/:categoryId/item/:itemId/image')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  removeMenuItemImage(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @Param('itemId', ParseObjectIdPipe) itemId: string,
    @GetUser() user: UserDocument,
    @Body('imageUrl') imageUrl: string,
  ) {
    return this.menuService.removeMenuItemImage(menuId, categoryId, itemId, user._id.toHexString(), imageUrl);
  }

  @Post(':menuId/category')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  addCategory(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @GetUser() user: UserDocument,
    @Body() createCategoryDtoArray: CreateCategoryArrayDTO,
  ) {
    return this.menuService.addCategory(menuId, user._id.toHexString(), createCategoryDtoArray.categories);
  }

  @Patch(':menuId/category/:categoryId')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  updateCategory(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @GetUser() user: UserDocument,
    @Body() updateCategoryDto: UpdateCategoryDTO,
  ) {
    return this.menuService.updateCategory(menuId, categoryId, user._id.toHexString(), updateCategoryDto);
  }

  @Delete(':menuId/category/:categoryId')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  removeCategory(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @GetUser() user: UserDocument,
  ) {
    return this.menuService.removeCategory(menuId, categoryId, user._id.toHexString());
  }

  @Post(':menuId/category/:categoryId/item')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  addMenuItem(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @GetUser() user: UserDocument,
    @Body() menuItemDto: MenuItemDTO,
  ) {
    return this.menuService.addMenuItem(menuId, categoryId, user._id.toHexString(), menuItemDto);
  }

  @Delete(':menuId/category/:categoryId/item/:itemId')
  @Roles(UserRole.HOTEL_OWNER)
  @UseGuards(JwtAccessGuard, RoleGuard)
  removeMenuItem(
    @Param('menuId', ParseObjectIdPipe) menuId: string,
    @Param('categoryId', ParseObjectIdPipe) categoryId: string,
    @Param('itemId', ParseObjectIdPipe) itemId: string,
    @GetUser() user: UserDocument,
  ) {
    return this.menuService.removeMenuItem(menuId, categoryId, itemId, user._id.toHexString());
  }

  @Get(':menuId/categories')
  getAllCategories(@Param('menuId', ParseObjectIdPipe) menuId: string) {
    return this.menuService.getAllCategories(menuId);
  }
}
