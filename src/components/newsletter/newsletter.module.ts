import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';
import { Member } from 'src/libs/entity/member.entity';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { ContentModule } from '../content/content.module';
import { MAIL_PROVIDER_TOKEN } from './services/mail-provider.interface';
import { SesMailProvider } from './services/ses-mail.provider';
import { NewsletterPageController } from './newsletter-page.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsletterSubscriber, Member]),
    ContentModule,
    ConfigModule,
  ],
  providers: [
    NewsletterService,
    {
      provide: MAIL_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService) => {
        return new SesMailProvider(configService);
      },
      inject: [ConfigService],
    },
  ],
  controllers: [NewsletterController, NewsletterPageController],
  exports: [NewsletterService],
})
export class NewsletterModule { }




