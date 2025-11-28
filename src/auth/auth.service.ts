import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UserLoginDTO } from './dtos/user-login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../user/schema/user.schema';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly jwtService: JwtService
    ) { }

    async signUp(createUserDto: CreateUserDTO) {

        const user = await this.userService.findByEmail(createUserDto.email)

        if (user) {
            throw new ConflictException("User with given email already exists")
        }
        return await this.userService.create({ ...createUserDto })
    }

    async signIn(loginUserDto: UserLoginDTO) {
        const { email, password } = loginUserDto;
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new NotFoundException("User Not found with given credentials")
        }
        const isPasswordMatched = await user.comparePassword(password)

        if (!isPasswordMatched) {
            throw new NotFoundException("User not found with given credentials")
        }
        const accessToken = await this.getAccessToken(user);
        const refreshToken = await this.getRefreshToken(user)

        await user.addSession(accessToken, refreshToken)

        return {
            accessToken,
            refreshToken
        }
    }


    async getAccessToken(user: UserDocument) {
        const { _id, email, role, name } = user;

        const tokenPayload = {
            id: _id.toHexString(),
            email,
            role,
            name
        }
        return this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
            expiresIn: `${parseInt(this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_EXPIRY_MS"))}`
        })
    }


    async getRefreshToken(user: UserDocument) {
        const { _id, email, role, name } = user;

        const tokenPayload = {
            id: _id.toHexString(),
            email,
        }
        return this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_SECRET"),
            expiresIn: `${parseInt(this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_EXPIRY_MS"))}`
        })
    }


}
