import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminUser } from 'src/libs/entity/admin-user.entity';
import { ConsultationsModule } from '../consultations/consultations.module';
import { MembersModule } from '../members/members.module';
import { NewsletterModule } from '../newsletter/newsletter.module';
import { ContentModule } from '../content/content.module';
import { AdminConsultationsController } from './controllers/admin-consultations.controller';
import { AdminMembersController } from './controllers/admin-members.controller';
import { AdminSettingsController } from './controllers/admin-settings.controller';
import { AdminNewsletterController } from './controllers/admin-newsletter.controller';
import { AdminContentController } from './controllers/admin-content.controller';
import { AdminCommentsController } from './controllers/admin-comments.controller';
import { AdminInsightsController } from './controllers/admin-insights.controller';
import { AdminAttachmentsController } from './controllers/admin-attachments.controller';
import { AdminUploadsController } from './controllers/admin-uploads.controller';
import { RolesGuard } from './roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminUser]),
    PassportModule,
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET || 'admin-dev-secret',
      signOptions: { expiresIn: '8h' },
    }),
    ConsultationsModule,
    MembersModule,
    NewsletterModule,
    ContentModule,
  ],
  providers: [AdminAuthService, AdminJwtStrategy, RolesGuard, JwtAuthGuard],
  controllers: [
    AdminAuthController,
    AdminConsultationsController,
    AdminMembersController,
    AdminSettingsController,
    AdminNewsletterController,
    AdminContentController,
    AdminCommentsController,
    AdminInsightsController,
    AdminAttachmentsController,
    AdminUploadsController,
  ],
  exports: [TypeOrmModule, AdminAuthService, AdminJwtStrategy, RolesGuard],
})
export class AdminAuthModule { }
