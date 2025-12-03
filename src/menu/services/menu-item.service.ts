import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument } from '../schemas/menu.schema';
import { MenuItemArrayDTO } from '../dto/create-menu.dto';
import { UpdateMenuItemDTO } from '../dto/update-menu-item.dto';
import { MenuAuthorizationService } from './menu-authorization.service';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Injectable()
export class MenuItemService {
  private readonly logger = new Logger(MenuItemService.name);

  constructor(
    @InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>,
    private readonly authService: MenuAuthorizationService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Add menu items to a category
   */
  async addMenuItem(
    menuId: string,
    categoryId: string,
    ownerId: Types.ObjectId,
    menuItemDto: MenuItemArrayDTO,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId, 'categories._id': categoryId },
      { $push: { 'categories.$.items': { $each: menuItemDto.items } } },
      { new: true },
    );

    if (!updatedMenu) {
      throw new NotFoundException('Category not found');
    }

    this.logger.log(`Added ${menuItemDto.items.length} items to category ${categoryId}`);
    return updatedMenu;
  }

  /**
   * Get all menu items from a category
   */
  async getMenuItems(menuId: string, categoryId: string, ownerId: Types.ObjectId) {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const category = menu.categories.find((cat) => cat._id.equals(categoryId));
    return category?.items ?? [];
  }

  /**
   * Update a menu item
   */
  async updateMenuItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    ownerId: Types.ObjectId,
    updateDto: UpdateMenuItemDTO,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updateFields: any = {};
    for (const key in updateDto) {
      updateFields[`categories.$[cat].items.$[item].${key}`] = updateDto[key];
    }

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      { $set: updateFields },
      {
        arrayFilters: [{ 'cat._id': categoryId }, { 'item._id': itemId }],
        new: true,
      },
    );

    if (!updatedMenu) {
      throw new NotFoundException('Menu item not found');
    }

    this.logger.log(`Updated menu item ${itemId} in category ${categoryId}`);
    return updatedMenu;
  }

  /**
   * Remove a menu item
   */
  async removeMenuItem(
    menuId: string,
    categoryId: string,
    itemId: string,
    ownerId: Types.ObjectId,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      { $pull: { 'categories.$[cat].items': { _id: itemId } } },
      {
        arrayFilters: [{ 'cat._id': categoryId }],
        new: true,
      },
    );

    if (!updatedMenu) {
      throw new NotFoundException('Category or Item not found');
    }

    this.logger.log(`Removed menu item ${itemId} from category ${categoryId}`);
    return updatedMenu;
  }

  /**
   * Upload an image for a menu item
   */
  async uploadMenuItemImage(
    menuId: string,
    categoryId: string,
    itemId: string,
    ownerId: Types.ObjectId,
    file: Express.Multer.File,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const result = await this.cloudinaryService.uploadMedia(file, 'menu_image');

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      {
        $push: {
          'categories.$[cat].items.$[item].media': {
            link: result.secure_url,
            publicId: result.public_id,
          },
        },
      },
      {
        arrayFilters: [{ 'cat._id': categoryId }, { 'item._id': itemId }],
        new: true,
      },
    );

    if (!updatedMenu) {
      throw new NotFoundException('Menu item not found');
    }

    this.logger.log(`Uploaded image for menu item ${itemId}`);
    return updatedMenu;
  }

  /**
   * Remove an image from a menu item
   */
  async removeMenuItemImage(
    menuId: string,
    categoryId: string,
    itemId: string,
    ownerId: Types.ObjectId,
    imageUrl: string,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      { $pull: { 'categories.$[cat].items.$[item].images': imageUrl } },
      {
        arrayFilters: [{ 'cat._id': categoryId }, { 'item._id': itemId }],
        new: true,
      },
    );

    if (!updatedMenu) {
      throw new NotFoundException('Menu item not found');
    }

    this.logger.log(`Removed image from menu item ${itemId}`);
    return updatedMenu;
  }
}
