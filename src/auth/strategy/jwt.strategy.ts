import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IAccessTokenPayload, IRefreshTokenPayload } from '../interfaces/token-payload.interface';
import { UserService } from '../../user/user.service';
import type { Request } from 'express';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt_access') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IAccessTokenPayload) {
    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new NotFoundException('User does not exist');
    }

    // validate against the database if the token still exists
    // in case of user logging out before the token expires - token will be removed from the database
    const accessToken = req.headers.authorization?.split('Bearer ')[1].trim()!;
    const isSessionValid = await user.isAccessTokenValid(accessToken);
    if (!isSessionValid) {
      throw new UnauthorizedException({
        message: 'Invalid Access Token',
      });
    }
    return user;
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt_refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IRefreshTokenPayload) {
    const user = await this.userService.findById(payload.id);
    if (!user) {
      throw new NotFoundException('User doesnot exist');
    }

    // validate against the database if the token still exists
    // in case of user logging out before the token expires - token will be removed from the database
    const refreshToken = req.headers.authorization?.split('Bearer ')[1].trim()!;

    const isSessionValid = await user.isRefreshTokenValid(refreshToken);
    if (!isSessionValid) {
      throw new UnauthorizedException({
        message: 'Invalid Refresh Token',
      });
    }

    return { user, refreshToken };
  }
}
