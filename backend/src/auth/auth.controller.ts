import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService, AuthTokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  SendPhoneOtpDto,
  VerifyOtpDto,
  VerifyPhoneOtpDto,
} from './dto/otp.dto';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/password.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from './types/authenticated-user.type';
import { PrismaService } from '../common/prisma/prisma.service';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private setRefreshCookie(res: Response, tokens: AuthTokens) {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      expires: tokens.refreshExpiresAt,
    });
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.register(dto);
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(dto);
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    const { user, tokens } = await this.authService.refresh(refreshToken);
    this.setRefreshCookie(res, tokens);
    return { user, accessToken: tokens.accessToken };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(refreshToken);
    this.clearRefreshCookie(res);
    return { loggedOut: true };
  }

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        state: true,
        avatarUrl: true,
        coinBalance: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        referralCode: true,
        createdAt: true,
      },
    });
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/send-otp')
  async sendEmailOtp(@CurrentUser() user: AuthenticatedUser) {
    await this.authService.sendEmailOtp(user.id, user.email);
    return { sent: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('email/verify-otp')
  async verifyEmailOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyOtpDto,
  ) {
    await this.authService.verifyEmailOtp(user.id, dto.code);
    return { verified: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('phone/send-otp')
  async sendPhoneOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendPhoneOtpDto,
  ) {
    await this.authService.sendPhoneOtp(user.id, dto.phone);
    return { sent: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('phone/verify-otp')
  async verifyPhoneOtp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VerifyPhoneOtpDto,
  ) {
    await this.authService.verifyPhoneOtp(user.id, dto.code);
    return { verified: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { sent: true };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
    return { reset: true };
  }

  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return { changed: true };
  }
}
