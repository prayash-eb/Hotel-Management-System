import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/schema/user.schema';

export type RoleTypes = UserRole.ADMIN | UserRole.CUSTOMER | UserRole.HOTEL_OWNER;

export const ROLE_KEY = 'roles';

export const Roles = (...roles: RoleTypes[]) => SetMetadata(ROLE_KEY, roles);
