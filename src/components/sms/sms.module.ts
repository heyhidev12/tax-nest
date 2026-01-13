import { Module } from '@nestjs/common';
import { SmsProvider } from './sms.provider';
import { AlimTalkProvider } from './alimtalk.provider';

@Module({
  providers: [SmsProvider, AlimTalkProvider],
  exports: [SmsProvider],
})
export class SmsModule {}
