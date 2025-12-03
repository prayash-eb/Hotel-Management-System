import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { CreateUserDTO } from './dtos/create-user.dto';
import { UserLoginDTO } from './dtos/user-login.dto';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from '../user/schema/user.schema';
import { ConfigService } from '@nestjs/config';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { randomBytes } from 'crypto';
import { hashToken } from '../utils/hash';
import { MailerService } from '@nestjs-modules/mailer';
import { generateEmailVerificationTemplate } from './email-templates/email-verification';
import { generateResetPasswordTemplate } from './email-templates/reset-password';
import { ChangePasswordDTO, ForgotPasswordDTO, ResetPasswordDTO } from './dtos/password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}

  async signUp(
    createUserDto: CreateUserDTO,
    file?: Express.Multer.File,
  ): Promise<{ message: string; user: UserDocument }> {
    this.logger.log(`Sign up attempt for email: ${createUserDto.email}`);

    const userExist = await this.userService.findByEmail(createUserDto.email);
    if (userExist) {
      throw new ConflictException('User with given email already exists');
    }

    const uploadFileResult = file
      ? await this.cloudinaryService.uploadMedia(file, 'profile_images')
      : null;

    const user = await this.userService.create({
      ...createUserDto,
      avatar: uploadFileResult?.secure_url,
      avatarPublicId: uploadFileResult?.public_id,
    });

    await this.sendVerificationLink(user);
    this.logger.log(`User ${user._id} created successfully`);

    return {
      message: 'User created successfully',
      user,
    };
  }

  async signIn(loginUserDto: UserLoginDTO): Promise<{ accessToken: string; refreshToken: string }> {
    const { email, password } = loginUserDto;

    this.logger.log(`Sign in attempt for email: ${email}`);

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.getAccessToken(user);
    const refreshToken = this.getRefreshToken(user);

    await user.addSession(accessToken, refreshToken);
    this.logger.log(`User ${user._id} signed in successfully`);

    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    user: UserDocument,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log(`Refreshing token for user ${user._id}`);

    // Remove the existing access and refresh token both
    await user.removeSession(refreshToken);

    const newAccessToken = this.getAccessToken(user);
    const newRefreshToken = this.getRefreshToken(user);

    await user.addSession(newAccessToken, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(user: UserDocument, accessToken: string): Promise<void> {
    this.logger.log(`Logout request for user ${user._id}`);

    const isAccessTokenValid = await user.isAccessTokenValid(accessToken);
    if (!isAccessTokenValid) {
      throw new UnauthorizedException('Invalid Access Token');
    }

    await user.removeSession(accessToken);
    this.logger.log(`User ${user._id} logged out successfully`);
  }

  async logoutAll(user: UserDocument, accessToken: string): Promise<void> {
    this.logger.log(`Logout all devices request for user ${user._id}`);

    const isAccessTokenValid = await user.isAccessTokenValid(accessToken);
    if (!isAccessTokenValid) {
      throw new UnauthorizedException('Invalid Access Token');
    }

    await user.clearAllSession();
    this.logger.log(`User ${user._id} logged out from all devices`);
  }

  async sendVerificationLink(user: UserDocument): Promise<void> {
    this.logger.log(`Sending verification link to user ${user._id}`);

    const isUserEmailVerified = user.isEmailVerified;
    if (isUserEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const verificationToken = randomBytes(64).toString('hex');
    const verificationTokenHash = hashToken(verificationToken);

    user.emailVerificationToken = verificationTokenHash;
    user.emailVerificationTokenExpiry = new Date(Date.now() + 5 * 60 * 60 * 1000);

    const verificationTemplateHTML = generateEmailVerificationTemplate({
      name: user.name,
      email: user.email,
      verificationUrl: `${process.env.NEST_BASE_URL}/auth/verify-email?token=${verificationToken}`,
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Email Verification',
      html: verificationTemplateHTML,
    });

    await user.save();
    this.logger.log(`Verification link sent to ${user.email}`);
  }

  async verifyEmail(verificationToken: string): Promise<void> {
    this.logger.log('Email verification attempt');

    const user = await this.userService.findByEmailVerificationToken(verificationToken);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpiry = undefined;
    await user.save();

    this.logger.log(`Email verified for user ${user._id}`);
  }

  getAccessToken(user: UserDocument): string {
    const { _id, email, role, name, isEmailVerified } = user;

    const tokenPayload = {
      id: _id.toHexString(),
      email,
      role,
      name,
      isEmailVerified,
    };

    const expiryMs = parseInt(this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_EXPIRY_MS'));
    return this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: Math.floor(expiryMs / 1000),
    });
  }

  getRefreshToken(user: UserDocument): string {
    const { _id, email } = user;

    const tokenPayload = {
      id: _id.toHexString(),
      email,
    };

    const expiryMs = parseInt(this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_EXPIRY_MS'));
    return this.jwtService.sign(tokenPayload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: Math.floor(expiryMs / 1000),
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDTO) {
    const user = await this.userService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // We don't want to reveal if user exists or not
      return { message: 'If user with given email exists, you will receive a password reset link' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.save();

    const resetUrl = `${process.env.NEST_BASE_URL}/auth/reset-password?token=${resetToken}`;
    const emailHtml = generateResetPasswordTemplate({
      name: user.name,
      resetUrl,
    });

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: emailHtml,
    });

    return { message: 'If user with given email exists, you will receive a password reset link' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDTO) {
    const tokenHash = hashToken(resetPasswordDto.token);
    const user = await this.userService.findByResetToken(tokenHash);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = resetPasswordDto.newPassword; // Will be hashed by pre-save hook
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpiry = undefined;

    // Optional: Invalidate all existing sessions for security
    await user.clearAllSession();

    await user.save();

    return { message: 'Password reset successfully' };
  }

  async changePassword(user: UserDocument, changePasswordDto: ChangePasswordDTO) {
    const isPasswordMatch = await user.comparePassword(changePasswordDto.oldPassword);
    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid old password');
    }

    user.password = changePasswordDto.newPassword; // Will be hashed by pre-save hook
    await user.save();

    return { message: 'Password changed successfully' };
  }
}
