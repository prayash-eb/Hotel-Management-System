import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDTO } from "../../auth/dtos/create-user.dto";

export class UpdateUserDTO extends PartialType(CreateUserDTO) { }