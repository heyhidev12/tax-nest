import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { VerificationCode } from 'src/libs/entity/verification-code.entity';
import { SmsProvider } from '../sms/sms.provider';
import { EmailProvider } from '../email/email.provider';
import { RedisService } from 'src/libs/redis/redis.service';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationCode)
    private repo: Repository<VerificationCode>,
    private smsProvider: SmsProvider,
    private emailProvider: EmailProvider,
    private redisService: RedisService,
  ) { }

  private getOtpLength(): number {
    return parseInt(process.env.OTP_LENGTH || '4', 10);
  }

  private generateCode(length: number) {
    const min = 0;
    const max = Math.pow(10, length) - 1;
    const code = Math.floor(Math.random() * (max - min + 1)) + min;
    return code.toString().padStart(length, '0');
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
    // Rate limit check for sending (e.g., 1 min between sends per target and purpose)
    const rateLimitKey = `verification:rate_limit:${purpose}:${target}`;
    const isRateLimited = await this.redisService.get(rateLimitKey);
    if (isRateLimited) {
      throw new BadRequestException('1분 후 다시 요청해주세요.');
    }

    // const isSignupOrChangePhone = purpose === 'SIGNUP' || purpose === 'CHANGE_PHONE';
    const codeLength = this.getOtpLength();
    // const expiryMinutes = 5;

    const code = this.generateCode(codeLength);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 5);

    // Invalidate previous unused codes for this target and purpose
    await this.repo.update({ target, purpose, isUsed: false }, { isUsed: true });

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

    // Set rate limit for sending (60 seconds)
    await this.redisService.set(rateLimitKey, '1', 60);

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

    const isSignupOrChangePhone = purpose === 'SIGNUP' || purpose === 'CHANGE_PHONE';

    if (!record) {
      throw new BadRequestException(isSignupOrChangePhone ? '유효하지 않거나 만료된 인증번호입니다.' : '먼저 인증번호를 요청해주세요.');
    }

    if (record.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(isSignupOrChangePhone ? '유효하지 않거나 만료된 인증번호입니다.' : '인증번호가 만료되었습니다.');
    }

    if (record.attempts >= 5) {
      throw new BadRequestException(isSignupOrChangePhone ? '인증 시도 횟수를 초과했습니다. 새로운 인증번호를 요청해주세요.' : '인증 시도 횟수를 초과했습니다. 다시 인증번호를 요청해주세요.');
    }

    if (record.code !== code) {
      record.attempts += 1;
      await this.repo.save(record);
      throw new BadRequestException(isSignupOrChangePhone ? '유효하지 않거나 만료된 인증번호입니다.' : '인증번호가 일치하지 않습니다.');
    }

    record.isUsed = true;
    await this.repo.save(record);

    return true;
  }
}
