import { Injectable, Logger } from '@nestjs/common';
import { MailProvider } from './mail-provider.interface';
import { EasyMailService } from './easy-mail.service';

@Injectable()
export class EasyMailProvider implements MailProvider {
  private readonly logger = new Logger(EasyMailProvider.name);

  constructor(private readonly easyMailService: EasyMailService) {}

  async subscribe(email: string, name?: string): Promise<void> {
    try {
      await this.easyMailService.subscribeSubscriber(email, name);
    } catch (error: any) {
      // Bubble up so caller can decide how to handle DB vs provider consistency
      this.logger.error(`EasyMail subscribe failed for ${email}: ${error?.message || error}`);
      throw error;
    }
  }

  async unsubscribe(email: string): Promise<void> {
    try {
      await this.easyMailService.unsubscribeSubscriber(email);
    } catch (error: any) {
      // Treat unsubscribe failures as soft errors; caller can log/retry
      this.logger.error(`EasyMail unsubscribe failed for ${email}: ${error?.message || error}`);
      throw error;
    }
  }

  async sendNewsletter(payload: {
    email: string;
    subject: string;
    html: string;
  }): Promise<void> {
    // Easy Mail doesn't currently have a dedicated wrapper here;
    // implement using a generic transactional email endpoint if available.
    // For now, just log; real integration can be filled in without touching callers.
    this.logger.log(
      `sendNewsletter (EasyMail) to=${payload.email} subject="${payload.subject}" – implement provider-specific call here.`,
    );
    // Example (pseudo):
    // await this.easyMailService.sendTransactionalEmail(payload.email, payload.subject, payload.html);
  }
}

