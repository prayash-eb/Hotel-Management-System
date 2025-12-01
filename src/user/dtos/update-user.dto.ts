import { IsPhoneNumber, IsString, Length } from "class-validator";

export class UpdateUserDTO {
    @IsString()
    name: string;
    
    @IsString()
    @IsPhoneNumber("NP")
    phoneNo: string;
}