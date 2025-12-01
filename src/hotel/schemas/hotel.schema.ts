import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HotelDocument = Hotel & Document;

// Embedded Media Schema
@Schema({ _id: false })
export class Media {
    @Prop({ required: true, enum: ['image', 'video', 'other'] })
    type: string;

    @Prop()
    label: string;

    @Prop({ required: true })
    link: string;
}

// Embedded Location Schema
@Schema({ _id: false })
export class Location {
    @Prop({ required: true })
    longitude: number;

    @Prop({ required: true })
    latitude: number;
}

// Embedded Address Schema
@Schema({ _id: false })
export class Address {
    @Prop({ type: Location, required: true })
    location: Location;
    @Prop({ required: true })
    street: string;
    @Prop({ required: true })
    city: string;
}

// Embedded TopReview Schema
@Schema({ _id: false })
export class TopReview {
    @Prop({ type: Types.ObjectId, required: true })
    reviewId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, required: true })
    customerId: Types.ObjectId;

    @Prop({ required: true })
    hotelName: string;

    @Prop({ required: true })
    customerName: string;

    @Prop({ required: true })
    ratingScore: number;

    @Prop({ required: true })
    reviewMessage: string;

    @Prop({ default: Date.now })
    createdAt: Date;

    @Prop({ default: Date.now })
    updatedAt: Date;
}

@Schema({ timestamps: true })
export class Hotel {
    @Prop({ type: Types.ObjectId, required: true, index: true })
    ownerId: Types.ObjectId;

    @Prop({ required: true, index: true })
    hotelName: string;

    @Prop({ type: Types.ObjectId })
    menuId: Types.ObjectId;

    @Prop({ type: [Media], default: [] })
    media: Media[];

    @Prop({ type: Address })
    address: Address;

    @Prop({ required: true, min: 0, max: 5, default: 0 })
    rating: number;

    @Prop({ type: [TopReview], default: [] })
    topReviews: TopReview[];

    @Prop({ default: false })
    isActive: boolean;
}

export const HotelSchema = SchemaFactory.createForClass(Hotel);

// Optional: Add compound indexes for fast queries
HotelSchema.index({ ownerId: 1, hotelName: 1 });
HotelSchema.index({ 'address.location.city': 1 });
HotelSchema.index({ rating: -1 });
