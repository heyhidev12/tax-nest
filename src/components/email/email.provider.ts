import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Initialize email transporter if credentials are available
    const emailHost = process.env.EMAIL_HOST;
    const emailPort = process.env.EMAIL_PORT;
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (emailHost && emailPort && emailUser && emailPass) {
      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: parseInt(emailPort, 10),
        secure: emailPort === '465', // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });
    }
  }

  async send(email: string, code: string): Promise<void> {
    if (!this.transporter) {
      // In development, just log the code
      console.log(`[DEV] Verification code for ${email}: ${code}`);
      return;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: '[Together] 인증번호',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">인증번호 안내</h2>
          <p>안녕하세요.</p>
          <p>요청하신 인증번호는 아래와 같습니다.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${code}</h1>
          </div>
          <p>인증번호는 5분간 유효합니다.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            본 메일은 발신 전용입니다.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      // In development, log the code instead of failing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV] Verification code for ${email}: ${code}`);
      } else {
        throw error;
      }
    }
  }
}
