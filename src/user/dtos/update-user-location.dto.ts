import { IsLatitude, IsLongitude, isString, IsString } from "class-validator";
export class UserLocationDTO {

    @IsString()
    street: string
    
    @IsString()
    city: string

    @IsLatitude()
    latitude: number

    @IsLongitude()
    longitude: number
}