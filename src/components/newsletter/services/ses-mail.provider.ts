import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailProvider } from './mail-provider.interface';

@Injectable()
export class SesMailProvider implements MailProvider {
  private readonly logger = new Logger(SesMailProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SES_SMTP_HOST');
    const port = Number(this.configService.get<string>('SES_SMTP_PORT') || 587);
    const user = this.configService.get<string>('SES_SMTP_USER');
    const pass = this.configService.get<string>('SES_SMTP_PASSWORD');
    this.fromAddress =
      this.configService.get<string>('SES_SENDER_EMAIL') ||
      this.configService.get<string>('EMAIL_SENDER') ||
      '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
    });

    if (!host || !user || !pass || !this.fromAddress) {
      this.logger.warn(
        'SES SMTP configuration is incomplete. SES provider will not be able to send emails until configured.',
      );
    }
  }

  async subscribe(email: string): Promise<void> {
    // SES does not manage mailing lists by itself; DB is the source of truth.
    // No-op here; subscription state is handled in the application/database layer.
    this.logger.log(`SES subscribe noop for ${email} (DB is source of truth).`);
  }

  async unsubscribe(email: string): Promise<void> {
    // Same reasoning as subscribe(): DB is the source of truth.
    this.logger.log(`SES unsubscribe noop for ${email} (DB is source of truth).`);
  }

  async sendNewsletter(payload: {
    email: string;
    subject: string;
    html: string;
  }): Promise<void> {
    if (!this.fromAddress) {
      this.logger.error('SES sender email is not configured; cannot send newsletter.');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: payload.email,
        subject: payload.subject,
        html: payload.html,
      });
    } catch (error: any) {
      this.logger.error(
        `SES sendNewsletter failed for ${payload.email}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }
}

