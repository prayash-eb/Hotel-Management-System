import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ _id: true })
export class MenuItem {
    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ required: true, min: 0 })
    price: number;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ required: true, enum: ['veg', 'non-veg', 'vegan'], default: 'veg' })
    type: string;

    @Prop({ default: true })
    isAvailable: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

@Schema({ _id: true })
export class MenuCategory {
    @Prop({ required: true })
    name: string;

    @Prop({ type: [MenuItemSchema], default: [] })
    items: MenuItem[];
}

export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);

@Schema({ timestamps: true })
export class Menu {
    @Prop({ type: Types.ObjectId, required: true, ref: 'Hotel', index: true })
    hotelId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop({ default: false })
    isActive: boolean;

    @Prop({ type: [MenuCategorySchema], default: [] })
    categories: MenuCategory[];
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

// Compound index to ensure efficient querying of menus per hotel
MenuSchema.index({ hotelId: 1, isActive: 1 });
