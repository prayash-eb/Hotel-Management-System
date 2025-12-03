import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument } from '../schemas/menu.schema';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dto/category.dto';
import { MenuAuthorizationService } from './menu-authorization.service';

@Injectable()
export class MenuCategoryService {
  private readonly logger = new Logger(MenuCategoryService.name);

  constructor(
    @InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>,
    private readonly authService: MenuAuthorizationService,
  ) {}

  /**
   * Add categories to a menu
   */
  async addCategory(
    menuId: string,
    ownerId: Types.ObjectId,
    categories: CreateCategoryDTO[],
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      {
        $push: {
          categories: {
            $each: categories.map((cat) => ({ ...cat, items: [] })),
          },
        },
      },
      { new: true },
    );

    this.logger.log(`Added ${categories.length} categories to menu ${menuId}`);
    return updatedMenu!;
  }

  /**
   * Get all categories from a menu
   */
  async getCategories(menuId: string) {
    const menu = await this.menuModel.findById(menuId).select('categories');
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu.categories.map((cat) => ({
      _id: cat._id,
      name: cat.name,
      link: cat.media,
    }));
  }

  /**
   * Update a category in a menu
   */
  async updateCategory(
    menuId: string,
    categoryId: string,
    ownerId: Types.ObjectId,
    updateCategoryDto: UpdateCategoryDTO,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId, 'categories._id': categoryId },
      { $set: { 'categories.$.name': updateCategoryDto.name } },
      { new: true },
    );

    if (!updatedMenu) {
      throw new NotFoundException('Category not found');
    }

    this.logger.log(`Updated category ${categoryId} in menu ${menuId}`);
    return updatedMenu;
  }

  /**
   * Remove a category from a menu
   */
  async removeCategory(
    menuId: string,
    categoryId: string,
    ownerId: Types.ObjectId,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    await this.authService.verifyMenuOwnership(menu, ownerId);

    const updatedMenu = await this.menuModel.findByIdAndUpdate(
      menuId,
      { $pull: { categories: { _id: categoryId } } },
      { new: true },
    );

    this.logger.log(`Removed category ${categoryId} from menu ${menuId}`);
    return updatedMenu!;
  }
}
