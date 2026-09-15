import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Single seam for outbound email/SMS. Defaults to logging to the console so
 * registration / forgot-password work end-to-end in dev without real
 * credentials. Swap NOTIFICATION_TRANSPORT + SMTP_* in .env to send for real.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly config: ConfigService) {}

  async sendOtpEmail(email: string, otp: string): Promise<void> {
    const transport = this.config.get<string>(
      'NOTIFICATION_TRANSPORT',
      'console',
    );
    if (transport === 'console') {
      this.logger.log(`[OTP] to=${email} code=${otp}`);
      return;
    }
    // TODO: wire an SMTP transport using SMTP_* env vars when going live.
    this.logger.warn(
      `Notification transport "${transport}" not implemented; falling back to console`,
    );
    this.logger.log(`[OTP] to=${email} code=${otp}`);
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
  ): Promise<void> {
    const transport = this.config.get<string>(
      'NOTIFICATION_TRANSPORT',
      'console',
    );
    if (transport === 'console') {
      this.logger.log(`[PASSWORD RESET] to=${email} token=${resetToken}`);
      return;
    }
    this.logger.warn(
      `Notification transport "${transport}" not implemented; falling back to console`,
    );
    this.logger.log(`[PASSWORD RESET] to=${email} token=${resetToken}`);
  }
}
