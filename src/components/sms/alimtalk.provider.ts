import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class AlimTalkProvider {
  private readonly logger = new Logger(AlimTalkProvider.name);

  async send(phoneNumber: string, code: string): Promise<boolean> {
    const appKey = process.env.NHN_ALIMTALK_APP_KEY;
    const secretKey = process.env.NHN_ALIMTALK_SECRET_KEY;
    const senderKey = process.env.NHN_ALIMTALK_SENDER_KEY;
    const templateCode = process.env.NHN_ALIMTALK_TEMPLATE_CODE;

    if (!appKey || !secretKey || !senderKey || !templateCode) {
      this.logger.warn('NHN AlimTalk configuration missing. Will fallback to SMS.');
      return false;
    }

    const timestamp = Date.now().toString();
    const url = `/alimtalk/v2.3/appkeys/${appKey}/messages`;

    // Create signature for NHN Cloud API
    const signature = this.createSignature(secretKey, 'POST', url, timestamp);

    const body = {
      senderKey: senderKey,
      templateCode: templateCode,
      recipientList: [
        {
          recipientNo: phoneNumber,
          templateParameter: {
            code: code,
          },
        },
      ],
    };

    try {
      const response = await axios.post(
        `https://api-alimtalk.cloud.toast.com${url}`,
        body,
        {
          headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'X-Secret-Key': secretKey,
            'X-Timestamp': timestamp,
          },
          timeout: 10000, // 10 second timeout
        },
      );

      // Check if response indicates success
      // NHN AlimTalk returns 200 with header.isSuccessful === true on success
      const header = response.data?.header;
      const isSuccess = 
        response.status === 200 && 
        header?.isSuccessful === true;

      if (isSuccess) {
        this.logger.log(`[AlimTalk] OTP sent successfully to ${phoneNumber}`);
        return true;
      } else {
        const resultCode = header?.resultCode;
        const resultMessage = header?.resultMessage;
        this.logger.warn(
          `[AlimTalk] Response indicates failure for ${phoneNumber}: isSuccessful=${header?.isSuccessful}, resultCode=${resultCode}, resultMessage=${resultMessage}`,
        );
        return false;
      }
    } catch (error) {
      // Log error but don't throw - let fallback handle it
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        const statusText = axiosError.response?.statusText;
        const errorData = axiosError.response?.data;
        
        this.logger.warn(
          `[AlimTalk] Sending failed for ${phoneNumber}: ${status} ${statusText} - ${JSON.stringify(errorData)}`,
        );
      } else if (error instanceof Error) {
        this.logger.warn(`[AlimTalk] Sending failed for ${phoneNumber}: ${error.message}`);
      } else {
        this.logger.warn(`[AlimTalk] Sending failed for ${phoneNumber}: Unknown error`);
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
