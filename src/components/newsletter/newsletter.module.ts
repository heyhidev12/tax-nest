import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';
import { Member } from 'src/libs/entity/member.entity';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { EasyMailService } from './services/easy-mail.service';
import { ContentModule } from '../content/content.module';
import { MAIL_PROVIDER_TOKEN } from './services/mail-provider.interface';
import { EasyMailProvider } from './services/easy-mail.provider';
import { SesMailProvider } from './services/ses-mail.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsletterSubscriber, Member]),
    ContentModule,
    ConfigModule,
  ],
  providers: [
    NewsletterService,
    EasyMailService,
    {
      provide: MAIL_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService, easyMailService: EasyMailService) => {
        const provider = (configService.get<string>('MAIL_PROVIDER') || 'easy-mail').toLowerCase();
        if (provider === 'ses') {
          return new SesMailProvider(configService);
        }
        // default: Easy Mail
        return new EasyMailProvider(easyMailService);
      },
      inject: [ConfigService, EasyMailService],
    },
  ],
  controllers: [NewsletterController],
  exports: [NewsletterService],
})
export class NewsletterModule {}




