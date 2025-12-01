import { IsString, IsOptional, IsEmail, Length, IsEnum, IsPhoneNumber } from "class-validator";
import { UserRole } from "../../user/schema/user.schema";

export class CreateUserDTO {
    @IsString()
    @Length(2, 50)
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @Length(5, 20)
    password: string;

    @IsString()
    @IsPhoneNumber("NP")
    @IsOptional()
    phoneNo?: string;

    @IsString()
    @IsOptional()
    avatar?: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole
}