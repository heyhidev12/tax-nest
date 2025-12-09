import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VerificationCode } from 'src/libs/entity/verification-code.entity';
import { SmsProvider } from '../sms/sms.provider';
import { EmailProvider } from '../email/email.provider';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCode)
    private repo: Repository<VerificationCode>,
    private smsProvider: SmsProvider,
    private emailProvider: EmailProvider,
  ) {}

  private generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendCode(
    type: 'EMAIL' | 'PHONE',
    target: string,
    purpose:
      | 'FIND_ID'
      | 'RESET_PASSWORD'
      | 'SIGNUP'
      | 'CHANGE_PHONE',
  ) {
    const code = this.generateCode();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 3);

    const verification = this.repo.create({
      type,
      target,
      code,
      purpose,
      expiresAt,
    });

    await this.repo.save(verification);

    // SEND: email or SMS
    if (type === 'PHONE') {
      await this.smsProvider.send(target, code);
    } else {
      await this.emailProvider.send(target, code);
    }

    return { success: true };
  }

  async verifyCode(
    target: string,
    purpose: 'FIND_ID' | 'RESET_PASSWORD' | 'SIGNUP' | 'CHANGE_PHONE',
    code: string,
  ) {
    const record = await this.repo.findOne({
      where: { target, purpose, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!record) throw new BadRequestException('먼저 인증번호를 요청해주세요.');
    if (record.expiresAt.getTime() < Date.now())
      throw new BadRequestException('인증번호가 만료되었습니다.');
    if (record.code !== code)
      throw new BadRequestException('인증번호가 일치하지 않습니다.');

    record.isUsed = true;
    await this.repo.save(record);

    return true;
  }
}
