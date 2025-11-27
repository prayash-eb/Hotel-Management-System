import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";

export enum UserRole {
    CUSTOMER = "customer",
    HOTEL_OWNER = "hotel_owner",
    ADMIN = "admin"
}

export type UserSession = {
    accessTokenHash: string;
    refreshTokenHash: string;
};

export interface IUserAddress {
    location: {
        type: "Point",
        coordinates: [number, number]
    };
    street: string;
    city: string;
}

export interface IUserDocumentMethods {
    comparePassword(plain: string): Promise<boolean>;
    addSession(accessTokenHash: string, refreshTokenHash: string): Promise<void>;
    removeSession(tokenHash: string): Promise<void>;
    clearAllSession(): Promise<void>;
}

@Schema({
    timestamps: true,
    toJSON: {
        transform: (doc: any, ret: any) => {
            delete ret.__v;
            delete ret.password;
            return ret;
        }
    }
})
export class User {

    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string;

    @Prop({ type: String })
    phoneNo: string;

    @Prop({ type: String })
    avatar: string;

    @Prop({
        type: [{
            location: {
                type: { type: String, enum: ["Point"], required: true, default: "Point" },
                coordinates: { type: [Number], required: true }
            },
            street: { type: String, required: true },
            city: { type: String, required: true }
        }],
        default: []
    })
    address: IUserAddress[];

    @Prop({ type: String })
    emailVerificationToken: string;

    @Prop({ type: Date })
    emailVerificationTokenExpiry: Date;

    @Prop({ type: String })
    resetPasswordToken: string;

    @Prop({ type: Date })
    resetPasswordTokenExpiry: Date;

    @Prop({
        type: String,
        enum: UserRole,
        default: UserRole.CUSTOMER
    })
    role: UserRole;

    @Prop({
        type: [{
            accessTokenHash: { type: String },
            refreshTokenHash: { type: String }
        }],
        default: []
    })
    session: UserSession[];
}

export type UserDocument = HydratedDocument<User> & IUserDocumentMethods;

export const UserSchema = SchemaFactory.createForClass(User);


// Geo index for addresses
UserSchema.index({ "address.location": "2dsphere" });

// hash password before saving to database
UserSchema.pre<UserDocument>("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// --------------------
// METHODS
// --------------------

// Compare password
UserSchema.methods.comparePassword = async function (plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
};

// Add session (max 3 active)
UserSchema.methods.addSession = async function (accessTokenHash: string, refreshTokenHash: string) {
    if (this.session.length >= 3) {
        this.session.shift(); // remove oldest
    }
    this.session.push({ accessTokenHash, refreshTokenHash });
    await this.save();
};

// Remove a single session by token hash
UserSchema.methods.removeSession = async function (tokenHash: string) {
    this.session = this.session.filter(
        (s: UserSession) => s.accessTokenHash !== tokenHash && s.refreshTokenHash !== tokenHash
    );
    await this.save();
};

// Clear all sessions
UserSchema.methods.clearAllSession = async function () {
    this.session = [];
    await this.save();
};
