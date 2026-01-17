import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { makeSignature } from 'src/libs/utils/naver-sens.util';
import { AlimTalkProvider } from './alimtalk.provider';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private readonly alimTalkProvider: AlimTalkProvider) {}

  async send(phoneNumber: string, code: string): Promise<void> {
    // Primary: Try NHN AlimTalk first
    const alimTalkSuccess = await this.alimTalkProvider.send(phoneNumber, code);
    
    if (alimTalkSuccess) {
      this.logger.log(`[Delivery] OTP delivered via AlimTalk to ${phoneNumber}`);
      return; // Success - immediately return, do NOT trigger SMS fallback
    }

    // Fallback: Use Naver Cloud SMS (only if AlimTalk actually failed)
    this.logger.log(`[Delivery] AlimTalk failed, falling back to SMS for ${phoneNumber}`);
    await this.sendViaSms(phoneNumber, code);
  }

  private async sendViaSms(phoneNumber: string, code: string): Promise<void> {
    const serviceId = process.env.NAVER_SMS_SERVICE_ID;
    const accessKey = process.env.NAVER_ACCESS_KEY;
    const secretKey = process.env.NAVER_SECRET_KEY;
    const sender = process.env.NAVER_SMS_SENDER;
    const timestamp = Date.now().toString();

    if (!serviceId || !accessKey || !secretKey || !sender) {
      this.logger.warn(`[SMS] Configuration missing. Skipping SMS send for ${phoneNumber}. AlimTalk already failed.`);
      // In development, log the code instead of failing
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Verification code for ${phoneNumber}: ${code}`);
      }
      // Do NOT throw error - gracefully skip SMS if config is missing
      // This prevents 500 errors when SMS sender is not registered
      return;
    }

    const url = `/sms/v2/services/${serviceId}/messages`;

    const signature = makeSignature({
      method: 'POST',
      url,
      timestamp,
      accessKey,
      secretKey,
    });

    const body = {
      type: 'SMS',
      from: sender,
      content: `[Together] 인증번호: ${code}`,
      messages: [{ to: phoneNumber }],
    };

    try {
      await axios.post(`https://sens.apigw.ntruss.com${url}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': accessKey,
          'x-ncp-apigw-signature-v2': signature,
        },
        timeout: 10000, // 10 second timeout
      });
      this.logger.log(`[Delivery] OTP delivered via SMS to ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`[SMS] Sending failed for ${phoneNumber}:`, error);
      // In development, log the code instead of failing
      if (process.env.NODE_ENV !== 'production') {
        this.logger.log(`[DEV] Verification code for ${phoneNumber}: ${code}`);
      }
      // Do NOT throw error - gracefully handle SMS failure
      // This prevents 500 errors when SMS sender is not registered
      // The OTP was already generated, so we just log the failure
    }
  }
}
