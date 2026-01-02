import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCode } from 'src/libs/entity/verification-code.entity';
import { VerificationService } from './verification.service';
import { SmsModule } from '../sms/sms.module';
import { EmailModule } from '../email/email.module';
import { RedisModule } from 'src/libs/redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VerificationCode]),
    SmsModule,
    EmailModule,
    RedisModule,
  ],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule { }
