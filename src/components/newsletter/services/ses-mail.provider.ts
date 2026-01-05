import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { MailProvider } from './mail-provider.interface';

@Injectable()
export class SesMailProvider implements MailProvider {
  private readonly logger = new Logger(SesMailProvider.name);
  private readonly sesClient: SESClient;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('SES_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('SES_SECRET_ACCESS_KEY');


    this.fromAddress =
      this.configService.get<string>('EMAIL_FROM') ||
      '';
    this.logger.verbose("NEWSLETTER FROM:", this.fromAddress);

    if (!region || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS SES configuration is incomplete (Region/AccessKey/SecretKey). Email sending will fail.',
      );
    }

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
    });
  }

  async subscribe(email: string): Promise<void> {
    // SES integration handles sending only.
    // Subscriber management is done purely in the local database.
    this.logger.debug(`[SES] subscribe called for ${email} (no-op)`);
  }

  async unsubscribe(email: string): Promise<void> {
    // SES integration handles sending only.
    // Subscriber management is done purely in the local database.
    this.logger.debug(`[SES] unsubscribe called for ${email} (no-op)`);
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

    const command = new SendEmailCommand({
      Source: this.fromAddress,
      Destination: {
        ToAddresses: [payload.email],
      },
      Message: {
        Subject: {
          Data: payload.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: payload.html,
            Charset: 'UTF-8',
          },
        },
      },
    });

    try {
      await this.sesClient.send(command);
    } catch (error: any) {
      this.logger.error(
        `SES sendNewsletter failed for ${payload.email}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }
}

