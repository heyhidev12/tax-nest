import { Injectable, Logger } from '@nestjs/common';
import { AlimTalkProvider } from './alimtalk.provider';
import { NhnSmsProvider } from './nhn-sms.provider';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(
    private readonly alimTalkProvider: AlimTalkProvider,
    private readonly nhnSmsProvider: NhnSmsProvider,
  ) {}

  async send(phoneNumber: string, code: string): Promise<void> {
    // 1. AlimTalk ni birinchi urinish
    this.logger.log(`[Delivery] Attempting AlimTalk for ${phoneNumber}`);
    const alimTalkSuccess = await this.alimTalkProvider.send(phoneNumber, code);
    
    if (alimTalkSuccess) {
      this.logger.log(`[Delivery] ✅ OTP delivered via AlimTalk to ${phoneNumber}`);
      return;
    }

    // 2. AlimTalk ishlamasa, NHN SMS fallback
    this.logger.log(`[Delivery] AlimTalk failed, trying NHN SMS for ${phoneNumber}`);
    const nhnSmsSuccess = await this.nhnSmsProvider.send(phoneNumber, code);
    
    if (nhnSmsSuccess) {
      this.logger.log(`[Delivery] ✅ OTP delivered via NHN SMS to ${phoneNumber}`);
      return;
    }

    // 3. Ikkalasi ham ishlamasa, development mode da code ni ko'rsatish
    this.logger.error(`[Delivery] ❌ Both AlimTalk and NHN SMS failed for ${phoneNumber}`);
    
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[DEV] 🔑 Verification code for ${phoneNumber}: ${code}`);
      console.log(`🔑 Verification code for ${phoneNumber}: ${code}`);
    }
    
    // Productionda error yozish lekin exception tashlamaslik
    if (process.env.NODE_ENV === 'production') {
      this.logger.error(`All delivery methods failed for ${phoneNumber}. OTP: ${code}`);
    }
  }
}