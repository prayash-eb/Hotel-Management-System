import { IsString, IsOptional, IsEmail, Length } from "class-validator";

export class CreateUserDTO {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsString()
    @Length(5, 20)
    password: string;

    @IsString()
    @IsOptional()
    phoneNo: string;

    @IsString()
    @IsOptional()
    avatar: string;

    @IsString()
    @IsOptional()
    role: string
}