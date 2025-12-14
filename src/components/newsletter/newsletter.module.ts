import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsletterSubscriber } from 'src/libs/entity/newsletter-subscriber.entity';
import { Member } from 'src/libs/entity/member.entity';
import { NewsletterService } from './newsletter.service';
import { NewsletterController } from './newsletter.controller';
import { EasyMailService } from './services/easy-mail.service';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NewsletterSubscriber, Member]),
    ContentModule,
  ],
  providers: [NewsletterService, EasyMailService],
  controllers: [NewsletterController],
  exports: [NewsletterService, EasyMailService],
})
export class NewsletterModule {}




