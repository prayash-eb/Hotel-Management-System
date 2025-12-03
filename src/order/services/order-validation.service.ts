import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Menu, MenuDocument } from '../../menu/schemas/menu.schema';
import { CreateOrderDTO } from '../dto/create-order.dto';

@Injectable()
export class OrderValidationService {
  constructor(@InjectModel(Menu.name) private readonly menuModel: Model<MenuDocument>) {}

  /**
   * Validates menu items and returns normalized order items
   */
  async validateAndNormalizeItems(hotelId: Types.ObjectId, dto: CreateOrderDTO) {
    const activeMenu = await this.menuModel.findOne({
      hotelId,
      isActive: true,
    });

    if (!activeMenu) {
      throw new NotFoundException('Active menu not found for the selected hotel');
    }

    return dto.items.map((item) => {
      const menuItem = this.findMenuItem(activeMenu, item.id);

      if (!menuItem || !menuItem.isAvailable) {
        throw new BadRequestException(`Menu item ${item.id} is unavailable`);
      }

      const lineTotal = menuItem.price * item.quantity;

      return {
        id: new Types.ObjectId(item.id),
        name: menuItem.name,
        description: menuItem.description,
        unitPrice: menuItem.price,
        quantity: item.quantity,
        lineTotal,
        notes: item.notes,
        images: menuItem.media ?? [],
      };
    });
  }

  /**
   * Validates delivery requirements based on fulfillment type
   */
  validateDeliveryRequirements(fulfillmentType: string, deliveryAddress?: any): void {
    if (fulfillmentType === 'delivery' && !deliveryAddress) {
      throw new BadRequestException('Delivery address is required for delivery orders');
    }
  }

  private findMenuItem(menu: MenuDocument, menuItemId: string) {
    for (const category of menu.categories) {
      const item = category.items.find((entry) => {
        const entryId = (entry as any)._id?.toString();
        return entryId === menuItemId;
      });
      if (item) {
        return item;
      }
    }
    return null;
  }
}
