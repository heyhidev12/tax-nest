import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { makeSignature } from 'src/libs/utils/naver-sens.util';

@Injectable()
export class SmsProvider {
  async send(phoneNumber: string, code: string): Promise<void> {
    const serviceId = process.env.NAVER_SMS_SERVICE_ID;
    const accessKey = process.env.NAVER_ACCESS_KEY;
    const secretKey = process.env.NAVER_SECRET_KEY;
    const sender = process.env.NAVER_SMS_SENDER;
    const timestamp = Date.now().toString();

    if (!serviceId || !accessKey || !secretKey || !sender) {
      console.warn('SMS configuration missing. Skipping SMS send.');
      console.log(`[DEV] Verification code for ${phoneNumber}: ${code}`);
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
      });
    } catch (error) {
      console.error('SMS sending failed:', error);
      // In development, log the code instead of failing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Verification code for ${phoneNumber}: ${code}`);
      } else {
        throw error;
      }
    }
  }
}
