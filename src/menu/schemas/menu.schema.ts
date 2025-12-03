import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MenuDocument = Menu & Document;

@Schema({ _id: true })
export class Media {
  @Prop({ required: true })
  link: string;
  @Prop({ required: true })
  publicId: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);

@Schema({ _id: true })
export class MenuItem {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: [MediaSchema], default: [] })
  media: Media[];

  @Prop({ type: String, enum: ['veg', 'non-veg', 'vegan'] })
  type: string;

  @Prop({ default: true })
  isAvailable: boolean;
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);

@Schema({ _id: true })
export class MenuCategory extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [MediaSchema] })
  media: Media;

  @Prop({ type: [MenuItemSchema], default: [] })
  items: MenuItem[];
}

export const MenuCategorySchema = SchemaFactory.createForClass(MenuCategory);

@Schema({ timestamps: true })
export class Menu {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Hotel', index: true })
  hotelId: Types.ObjectId;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;

  @Prop({ type: [MenuCategorySchema], default: [] })
  categories: MenuCategory[];
}

export const MenuSchema = SchemaFactory.createForClass(Menu);

// Compound index to ensure efficient querying of menus per hotel
MenuSchema.index({ hotelId: 1, isActive: 1 });
