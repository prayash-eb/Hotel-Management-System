import { PickType } from '@nestjs/mapped-types';
import { CreateUserDTO } from './create-user.dto';

export class UserLoginDTO extends PickType(CreateUserDTO, ['email', 'password'] as const) {}
