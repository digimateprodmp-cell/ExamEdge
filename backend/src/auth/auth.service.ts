import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { Role, VerificationPurpose } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationService } from '../common/notifications/notification.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/authenticated-user.type';

const REFRESH_COOKIE_NAME = 'refresh_token';
const OTP_TTL_MINUTES = 10;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  coinBalance: number;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  referralCode: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  static readonly REFRESH_COOKIE_NAME = REFRESH_COOKIE_NAME;

  private toPublicUser(user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: Role;
    coinBalance: number;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    referralCode: string;
  }): PublicUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      coinBalance: user.coinBalance,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      referralCode: user.referralCode,
    };
  }

  private async generateReferralCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode: code },
      });
      if (!existing) return code;
    }
    return crypto.randomUUID().slice(0, 8).toUpperCase();
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwt.sign(
      { sub: user.id },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      },
    );

    const refreshExpiresAt = this.parseExpiryToDate(
      this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );

    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash, expiresAt: refreshExpiresAt },
    });

    return { accessToken, refreshToken, refreshExpiresAt };
  }

  private parseExpiryToDate(expiresIn: string): Date {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    const now = Date.now();
    if (!match) return new Date(now + 7 * 24 * 60 * 60 * 1000);
    const value = Number(match[1]);
    const unitMs =
      { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]] ??
      86_400_000;
    return new Date(now + value * unitMs);
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });
    if (existing) {
      throw new ConflictException(
        'An account with this email or phone already exists',
      );
    }

    let referredById: string | undefined;
    if (dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer) referredById = referrer.id;
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const referralCode = await this.generateReferralCode();

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        state: dto.state,
        referralCode,
        referredById,
      },
    });

    if (referredById) {
      await this.prisma.$transaction([
        this.prisma.coinTransaction.create({
          data: {
            userId: referredById,
            type: 'CREDIT',
            amount: 50,
            reason: 'Referral signup bonus',
            refType: 'User',
            refId: user.id,
          },
        }),
        this.prisma.user.update({
          where: { id: referredById },
          data: { coinBalance: { increment: 50 } },
        }),
      ]);
    }

    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }

    let payload: { sub: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let matched: (typeof candidates)[number] | undefined;
    for (const candidate of candidates) {
      if (await bcrypt.compare(refreshToken, candidate.tokenHash)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.deletedAt || !user.isActive) {
      throw new UnauthorizedException('Account no longer active');
    }

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    try {
      const payload = this.jwt.verify<{ sub: string }>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      const candidates = await this.prisma.refreshToken.findMany({
        where: { userId: payload.sub, revokedAt: null },
      });
      for (const candidate of candidates) {
        if (await bcrypt.compare(refreshToken, candidate.tokenHash)) {
          await this.prisma.refreshToken.update({
            where: { id: candidate.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } catch {
      // best-effort logout; an invalid/expired token is already unusable
    }
  }

  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendEmailOtp(userId: string, email: string) {
    const code = this.generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.verificationToken.create({
      data: {
        userId,
        purpose: VerificationPurpose.EMAIL_VERIFY,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });
    await this.notifications.sendOtpEmail(email, code);
  }

  async verifyEmailOtp(userId: string, code: string) {
    await this.consumeOtp(userId, VerificationPurpose.EMAIL_VERIFY, code);
    await this.prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });
  }

  async sendPhoneOtp(userId: string, phone: string) {
    const code = this.generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.verificationToken.create({
      data: {
        userId,
        purpose: VerificationPurpose.PHONE_VERIFY,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });
    // Console/log transport doubles as the SMS seam for dev.
    await this.notifications.sendOtpEmail(`sms:${phone}`, code);
  }

  async verifyPhoneOtp(userId: string, code: string) {
    await this.consumeOtp(userId, VerificationPurpose.PHONE_VERIFY, code);
    await this.prisma.user.update({
      where: { id: userId },
      data: { isPhoneVerified: true },
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return; // don't leak whether the email exists

    const code = this.generateOtp();
    const codeHash = await bcrypt.hash(code, 10);
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        purpose: VerificationPurpose.PASSWORD_RESET,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60_000),
      },
    });
    await this.notifications.sendPasswordResetEmail(email, code);
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException('Invalid or expired code');

    await this.consumeOtp(user.id, VerificationPurpose.PASSWORD_RESET, code);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  private async consumeOtp(
    userId: string,
    purpose: VerificationPurpose,
    code: string,
  ) {
    const candidates = await this.prisma.verificationToken.findMany({
      where: {
        userId,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const candidate of candidates) {
      if (await bcrypt.compare(code, candidate.codeHash)) {
        await this.prisma.verificationToken.update({
          where: { id: candidate.id },
          data: { consumedAt: new Date() },
        });
        return;
      }
    }

    throw new BadRequestException('Invalid or expired code');
  }
}
