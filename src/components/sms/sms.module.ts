import { Module } from '@nestjs/common';
import { SmsProvider } from './sms.provider';
import { AlimTalkProvider } from './alimtalk.provider';
import { NhnSmsProvider } from './nhn-sms.provider';

@Module({
  providers: [SmsProvider, AlimTalkProvider, NhnSmsProvider],
  exports: [SmsProvider],
})
export class SmsModule {}
