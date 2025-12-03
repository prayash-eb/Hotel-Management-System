import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { toObjectId } from '../utils/object-id.util';
import { Menu, MenuDocument } from './schemas/menu.schema';
import { CreateMenuDTO } from './dto/create-menu.dto';
import { UpdateMenuDTO } from './dto/update-menu.dto';
import { Hotel, HotelDocument } from '../hotel/schemas/hotel.schema';
import { MenuAuthorizationService } from './services/menu-authorization.service';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    @InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>,
    @InjectModel(Hotel.name) private readonly hotelModel: Model<HotelDocument>,
    private readonly authService: MenuAuthorizationService,
  ) {}

  async create(ownerId: Types.ObjectId, createMenuDto: CreateMenuDTO): Promise<MenuDocument> {
    const hotelObjectId = toObjectId(createMenuDto.hotelId, 'hotelId');

    // Verify hotel ownership
    await this.authService.verifyHotelOwnership(hotelObjectId, ownerId);

    const menu = new this.menuModel({
      ...createMenuDto,
      hotelId: hotelObjectId,
    });

    const savedMenu = await menu.save();
    this.logger.log(`Menu created for hotel ${hotelObjectId}`);
    return savedMenu;
  }

  async findAllByHotel(hotelId: string): Promise<MenuDocument[]> {
    return this.menuModel.find({ hotelId });
  }

  async findOne(menuId: string): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    return menu;
  }

  async activateMenu(hotelId: string, menuId: string): Promise<MenuDocument | null> {
    const hotel = await this.hotelModel.findById(hotelId);
    if (!hotel) {
      throw new NotFoundException('Hotel with given id not found');
    }

    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu with given id not found');
    }

    // Deactivate all menus for this hotel first
    await this.menuModel.updateMany({ hotelId }, { $set: { isActive: false } });

    // Activate the specific menu
    const updatedMenu = await this.menuModel.findOneAndUpdate(
      { _id: menuId },
      { $set: { isActive: true } },
      { new: true, runValidators: true },
    );

    this.logger.log(`Menu ${menuId} activated for hotel ${hotelId}`);
    return updatedMenu;
  }

  async getActiveMenu(hotelId: string): Promise<MenuDocument> {
    const menu = await this.menuModel.findOne({
      hotelId,
      isActive: true,
    });

    if (!menu) {
      throw new NotFoundException('No active menu found for this hotel');
    }

    return menu;
  }

  async update(
    menuId: string,
    ownerId: string,
    updateMenuDto: UpdateMenuDTO,
  ): Promise<MenuDocument> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    // Verify ownership
    const ownerObjectId = toObjectId(ownerId, 'ownerId');
    await this.authService.verifyMenuOwnership(menu, ownerObjectId);

    // If setting to active, deactivate other menus for this hotel
    if (updateMenuDto.isActive === true) {
      await this.menuModel.updateMany(
        { hotelId: menu.hotelId, _id: { $ne: menu._id } },
        { $set: { isActive: false } },
      );

      // Update hotel's menuId reference
      await this.hotelModel.findByIdAndUpdate(menu.hotelId, {
        menuId: menu._id,
      });
    }

    Object.assign(menu, updateMenuDto);
    const updatedMenu = await menu.save();
    this.logger.log(`Menu ${menuId} updated`);
    return updatedMenu;
  }

  async remove(menuId: string, ownerId: string): Promise<any> {
    const menu = await this.menuModel.findById(menuId);
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    const ownerObjectId = toObjectId(ownerId, 'ownerId');
    await this.authService.verifyMenuOwnership(menu, ownerObjectId);

    if (menu.isActive) {
      // If deleting active menu, unset the hotel's menuId
      await this.hotelModel.findByIdAndUpdate(menu.hotelId, {
        $unset: { menuId: 1 },
      });
    }

    const result = await menu.deleteOne();
    this.logger.log(`Menu ${menuId} deleted`);
    return result;
  }
}
