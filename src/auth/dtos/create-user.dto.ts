import {
  IsString,
  IsOptional,
  IsEmail,
  Length,
  IsEnum,
  IsPhoneNumber,
  IsNotEmpty,
} from 'class-validator';
import { UserRole } from '../../user/schema/user.schema';

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
  @IsPhoneNumber('NP')
  @IsOptional()
  @IsNotEmpty()
  phoneNo?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  avatarPublicId?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
