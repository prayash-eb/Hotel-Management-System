import { IsOptional, IsString, Length } from "class-validator";

export default class RejectHotelReasonDTO {
    @IsString()
    @Length(5, 500)
    reason: string
}