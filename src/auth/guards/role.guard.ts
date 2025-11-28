import { CanActivate, ExecutionContext, ForbiddenException, Injectable,  } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { ROLE_KEY, RoleTypes } from "../decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate {

    constructor(private readonly reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {

        const requiredRoles = this.reflector.getAllAndOverride<RoleTypes[]>(
            ROLE_KEY,
            [context.getHandler(), context.getClass()]
        );
        if (!requiredRoles || requiredRoles.length === 0) {
            return true
        }
        const request = context.switchToHttp().getRequest();
        const { user } = request;
        if (!user || !user.role) {
            throw new ForbiddenException({
                message: "Missing Role"
            })
        }
        const isRoleValid = requiredRoles.includes(user.role)
        if (!isRoleValid) {
            throw new ForbiddenException({
                message: `Required ${requiredRoles} privileges`
            })
        }
        return true
    }

}   