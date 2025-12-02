import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument } from './schemas/menu.schema';
import { CreateMenuDTO, MenuItemDTO } from './dto/create-menu.dto';
import { UpdateMenuDTO } from './dto/update-menu.dto';
import { Hotel, HotelDocument } from '../hotel/schemas/hotel.schema';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { UpdateMenuItemDTO } from './dto/update-menu-item.dto';
import { CreateCategoryArrayDTO, CreateCategoryDTO, UpdateCategoryDTO } from './dto/category.dto';

@Injectable()
export class MenuService {
    constructor(
        @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
        @InjectModel(Hotel.name) private hotelModel: Model<HotelDocument>,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    async create(hotelId: string, ownerId: string, createMenuDto: CreateMenuDTO) {
        // Verify hotel ownership
        const hotel = await this.hotelModel.findOne({ _id: hotelId, ownerId });
        if (!hotel) {
            throw new NotFoundException('Hotel not found or you are not the owner');
        }

        const menu = new this.menuModel({
            hotelId: new Types.ObjectId(hotelId),
            ...createMenuDto,
        });

        return await menu.save();
    }

    async findAllByHotel(hotelId: string) {
        return await this.menuModel.find({ hotelId: new Types.ObjectId(hotelId) });
    }

    async findOne(menuId: string) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');
        return menu;
    }

    async update(menuId: string, ownerId: string, updateMenuDto: UpdateMenuDTO) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        // Verify hotel ownership via the menu's hotelId
        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        // If setting to active, deactivate other menus for this hotel
        if (updateMenuDto.isActive === true) {
            await this.menuModel.updateMany(
                { hotelId: menu.hotelId, _id: { $ne: menu._id } },
                { $set: { isActive: false } }
            );

            // Update hotel's menuId reference
            await this.hotelModel.findByIdAndUpdate(menu.hotelId, { menuId: menu._id });
        }

        Object.assign(menu, updateMenuDto);
        return await menu.save();
    }

    async remove(menuId: string, ownerId: string) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        if (menu.isActive) {
            // If deleting active menu, unset the hotel's menuId
            await this.hotelModel.findByIdAndUpdate(menu.hotelId, { $unset: { menuId: 1 } });
        }

        return await menu.deleteOne();
    }

    async getActiveMenu(hotelId: string) {
        const menu = await this.menuModel.findOne({ hotelId: new Types.ObjectId(hotelId), isActive: true });
        if (!menu) throw new NotFoundException('No active menu found for this hotel');
        return menu;
    }

    async updateMenuItem(menuId: string, categoryId: string, itemId: string, ownerId: string, updateDto: UpdateMenuItemDTO) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const updateFields: any = {};
        for (const key in updateDto) {
            updateFields[`categories.$[cat].items.$[item].${key}`] = updateDto[key];
        }

        const updatedMenu = await this.menuModel.findOneAndUpdate(
            { _id: menuId },
            { $set: updateFields },
            {
                arrayFilters: [
                    { 'cat._id': new Types.ObjectId(categoryId) },
                    { 'item._id': new Types.ObjectId(itemId) }
                ],
                new: true
            }
        );

        if (!updatedMenu) throw new NotFoundException('Menu item not found');
        return updatedMenu;
    }

    async uploadMenuItemImage(menuId: string, categoryId: string, itemId: string, ownerId: string, file: Express.Multer.File) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const result = await this.cloudinaryService.uploadMedia(file, "menu_image");

        const updatedMenu = await this.menuModel.findOneAndUpdate(
            { _id: menuId },
            { $push: { 'categories.$[cat].items.$[item].media': { link: result.secure_url, publicId: result.public_id } } },
            {
                arrayFilters: [
                    { 'cat._id': new Types.ObjectId(categoryId) },
                    { 'item._id': new Types.ObjectId(itemId) }
                ],
                new: true
            }
        );

        if (!updatedMenu) throw new NotFoundException('Menu item not found');
        return updatedMenu;
    }

    async removeMenuItemImage(menuId: string, categoryId: string, itemId: string, ownerId: string, imageUrl: string) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const updatedMenu = await this.menuModel.findOneAndUpdate(
            { _id: menuId },
            { $pull: { 'categories.$[cat].items.$[item].images': imageUrl } },
            {
                arrayFilters: [
                    { 'cat._id': new Types.ObjectId(categoryId) },
                    { 'item._id': new Types.ObjectId(itemId) }
                ],
                new: true
            }
        );

        if (!updatedMenu) throw new NotFoundException('Menu item not found');
        return updatedMenu;
    }

    async addCategory(menuId: string, ownerId: string, categories: CreateCategoryDTO[]) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        return await this.menuModel.findByIdAndUpdate(
            menuId,
            {
                $push: {
                    categories: {
                        $each: categories.map(cat => ({ ...cat, items: [] }))
                    }
                }
            },
            { new: true }
        );

    }

    async updateCategory(menuId: string, categoryId: string, ownerId: string, updateCategoryDto: UpdateCategoryDTO) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const updatedMenu = await this.menuModel.findOneAndUpdate(
            { _id: menuId, 'categories._id': categoryId },
            { $set: { 'categories.$.name': updateCategoryDto.name } },
            { new: true }
        );

        if (!updatedMenu) throw new NotFoundException('Category not found');
        return updatedMenu;
    }

    async removeCategory(menuId: string, categoryId: string, ownerId: string) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const updatedMenu = await this.menuModel.findByIdAndUpdate(
            menuId,
            { $pull: { categories: { _id: categoryId } } },
            { new: true }
        );
        return updatedMenu;
    }

    async addMenuItem(menuId: string, categoryId: string, ownerId: string, menuItemDto: MenuItemDTO) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const updatedMenu = await this.menuModel.findOneAndUpdate(
            { _id: menuId, 'categories._id': categoryId },
            { $push: { 'categories.$.items': menuItemDto } },
            { new: true }
        );

        if (!updatedMenu) throw new NotFoundException('Category not found');
        return updatedMenu;
    }

    async removeMenuItem(menuId: string, categoryId: string, itemId: string, ownerId: string) {
        const menu = await this.menuModel.findById(menuId);
        if (!menu) throw new NotFoundException('Menu not found');

        const hotel = await this.hotelModel.findOne({ _id: menu.hotelId, ownerId });
        if (!hotel) throw new NotFoundException('You are not the owner of the hotel this menu belongs to');

        const updatedMenu = await this.menuModel.findOneAndUpdate(
            { _id: menuId },
            { $pull: { 'categories.$[cat].items': { _id: itemId } } },
            {
                arrayFilters: [{ 'cat._id': new Types.ObjectId(categoryId) }],
                new: true
            }
        );

        if (!updatedMenu) throw new NotFoundException('Category or Item not found');
        return updatedMenu;
    }

    async getAllCategories(menuId: string) {
        const menu = await this.menuModel.findById(menuId).select('categories');
        if (!menu) throw new NotFoundException('Menu not found');
        return menu.categories;
    }
}
