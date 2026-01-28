import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Member } from '../../libs/entity/member.entity';
import { Consultation } from '../../libs/entity/consultation.entity';
import { NewsletterSubscriber } from '../../libs/entity/newsletter-subscriber.entity';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Consultation, NewsletterSubscriber])],
  providers: [MembersService],
  controllers: [MembersController],
  exports: [MembersService, TypeOrmModule], // Auth에서 재사용하기 위해 export
})
export class MembersModule {}
