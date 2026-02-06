import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class NhnSmsProvider {
  private readonly logger = new Logger(NhnSmsProvider.name);

  async send(phoneNumber: string, code: string): Promise<boolean> {
    const appKey = process.env.NHN_SMS_APP_KEY;
    const secretKey = process.env.NHN_SMS_SECRET_KEY;
    const sender = process.env.NHN_SMS_SENDER;

    if (!appKey || !secretKey || !sender) {
      this.logger.warn('NHN SMS configuration missing');
      return false;
    }

    const timestamp = Date.now().toString();
    const url = `/sms/v2.3/appKeys/${appKey}/messages`;

    // Create signature for NHN SMS API
    const signature = this.createSignature(secretKey, 'POST', url, timestamp);

    const body = {
      body: `[Together] 인증번호: ${code}`,
      sendNo: sender,
      recipientList: [
        {
          recipientNo: phoneNumber,
        },
      ],
    };

    try {
      const response = await axios.post(
        `https://api-sms.cloud.toast.com${url}`,
        body,
        {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-Secret-Key': secretKey,
            'X-Timestamp': timestamp,
            'Authorization': signature, 
          },
          timeout: 10000,
        },
      );

      const header = response.data?.header;
      const isSuccess = 
        response.status === 200 && 
        header?.isSuccessful === true;

      if (isSuccess) {
        this.logger.log(`[NHN SMS] OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        const resultCode = header?.resultCode;
        const resultMessage = header?.resultMessage;
        this.logger.warn(
          `[NHN SMS] Response indicates failure for ${phoneNumber}: resultCode=${resultCode}, resultMessage=${resultMessage}`,
        );
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const statusText = axiosError.response?.statusText;
        const errorData = axiosError.response?.data;
        
        this.logger.warn(
          `[NHN SMS] Sending failed for ${phoneNumber}: ${status} ${statusText} - ${JSON.stringify(errorData)}`,
        );
      } else if (error instanceof Error) {
        this.logger.warn(`[NHN SMS] Sending failed for ${phoneNumber}: ${error.message}`);
      } else {
        this.logger.warn(`[NHN SMS] Sending failed for ${phoneNumber}: Unknown error`);
      }
      return false;
    }
  }

  private createSignature(secretKey: string, method: string, url: string, timestamp: string): string {
    const message = `${method} ${url}\n${timestamp}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('base64');
    return signature;
  }
}