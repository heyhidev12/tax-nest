import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MembersModule } from './members/members.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { ContentModule } from './content/content.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    AuthModule,
    MembersModule,
    ConsultationsModule,
    AdminAuthModule,
    ContentModule,
    NewsletterModule,
    VerificationModule,
  ],
})
export class ComponentsModule {}
