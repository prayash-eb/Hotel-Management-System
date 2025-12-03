import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtAccessGuard extends AuthGuard('jwt_access') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    return super.handleRequest(err, user, info, context, status);
  }
}

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt_refresh') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    return super.handleRequest(err, user, info, context, status);
  }
}
