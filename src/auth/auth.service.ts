import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UserLoginDTO } from './dtos/user-login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../user/schema/user.schema';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { randomBytes } from 'crypto';
import { hashToken } from '../utils/hash';
import { MailerService } from '@nestjs-modules/mailer';
import { generateEmailVerificationTemplate } from './email-templates/email-verification';

@Injectable()
export class AuthService {
    constructor(
        private readonly configService: ConfigService,
        private readonly userService: UserService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly jwtService: JwtService,
        private mailService: MailerService
    ) { }

    async signUp(createUserDto: CreateUserDTO, file: Express.Multer.File) {
        const userExist = await this.userService.findByEmail(createUserDto.email)
        if (userExist) {
            throw new ConflictException("User with given email already exists")
        }

        const uploadFileResult = file ? await this.cloudinaryService.uploadImage(file) : null

        const user = await this.userService.create({
            ...createUserDto,
            avatar: uploadFileResult?.secure_url ?? null
        })

        await this.sendVerificationLink(user)
        return {
            message: "User created successfully",
            user
        };
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


    async refreshToken(user: UserDocument, refreshToken: string) {

        // remove the exisiting access and refresh token both
        // take any token as param and remove associated token
        await user.removeSession(refreshToken)

        const newAccessToken = this.getAccessToken(user);
        const newRefreshToken = this.getRefreshToken(user)

        await user.addSession(newAccessToken, newRefreshToken)
        return {
            accessToken: this.getAccessToken(user),
            refreshToken: this.getRefreshToken(user)
        }
    }

    async logout(user: UserDocument, accessToken: string) {
        const isAccessTokenValid = user.isAccessTokenValid(accessToken);
        if (!isAccessTokenValid) {
            throw new UnauthorizedException("Invalid Access Token")
        }
        await user.removeSession(accessToken)
    }


    async logoutAll(user: UserDocument, accessToken: string) {
        const isAccessTokenValid = user.isAccessTokenValid(accessToken);
        if (!isAccessTokenValid) {
            throw new UnauthorizedException("Invalid Access Token")
        }
        await user.clearAllSession()
    }

    async sendVerificationLink(user: UserDocument) {
        const isUserEmailVerified = user.isEmailVerified;
        if(isUserEmailVerified){
            throw new BadRequestException("Email already verified")
        }
        const verificationToken = randomBytes(64).toString("hex")
        const verificationTokenHash = hashToken(verificationToken)

        user.emailVerificationToken = verificationTokenHash;
        user.emailVerificationTokenExpiry = new Date(Date.now() + 5 * 60 * 60 * 1000)

        const verificationTemplateHTML = generateEmailVerificationTemplate({
            name: user.name,
            email: user.email,
            verificationUrl: `${process.env.NEST_BASE_URL}/auth/verify-email?token=${verificationToken}`
        })

        await this.mailService.sendMail({
            to: user.email,
            subject: "Email Verification",
            html: verificationTemplateHTML
        })
        await user.save()

    }

    async verifyEmail(verificationToken: string) {

        const user = await this.userService.findByEmailVerificationToken(verificationToken)

        if (!user) {
            throw new BadRequestException("Invalid or expired verification token");
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationTokenExpiry = undefined;
        await user.save();
    }

    getAccessToken(user: UserDocument) {
        const { _id, email, role, name } = user;

        const tokenPayload = {
            id: _id.toHexString(),
            email,
            role,
            name
        }
        const expiryMs = parseInt(this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_EXPIRY_MS"));
        return this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow<string>("JWT_ACCESS_TOKEN_SECRET"),
            expiresIn: Math.floor(expiryMs / 1000)
        })
    }

    getRefreshToken(user: UserDocument) {
        const { _id, email } = user;

        const tokenPayload = {
            id: _id.toHexString(),
            email,
        }
        const expiryMs = parseInt(this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_EXPIRY_MS"))
        return this.jwtService.sign(tokenPayload, {
            secret: this.configService.getOrThrow<string>("JWT_REFRESH_TOKEN_SECRET"),
            expiresIn: Math.floor(expiryMs / 1000)
        })
    }
}
