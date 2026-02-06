import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { MainBanner } from 'src/libs/entity/main-banner.entity';
import { HistoryYear, HistoryItem } from 'src/libs/entity/history.entity';
import { AwardYear, Award } from 'src/libs/entity/award.entity';
import { Branch } from 'src/libs/entity/branch.entity';
import { KeyCustomer } from 'src/libs/entity/key-customer.entity';
import { BusinessArea } from 'src/libs/entity/business-area.entity';
import { TrainingSeminar, TrainingSeminarApplication } from 'src/libs/entity/training-seminar.entity';
import { MajorCategory, MinorCategory } from 'src/libs/entity/category.entity';
import { TaxMember } from 'src/libs/entity/tax-member.entity';
import { Member } from 'src/libs/entity/member.entity';
import { ExposureSettings } from 'src/libs/entity/exposure-settings.entity';
import { InsightsCategory } from 'src/libs/entity/insights-category.entity';
import { InsightsSubcategory } from 'src/libs/entity/insights-subcategory.entity';
import { InsightsItem, InsightsComment, InsightsCommentReport } from 'src/libs/entity/insights-item.entity';
import { Attachment } from 'src/libs/entity/attachment.entity';
import { BusinessAreaCategory } from 'src/libs/entity/business-area-category.entity';
import { FooterPolicy } from 'src/libs/entity/footer-policy.entity';
import { FamilySite } from 'src/libs/entity/family-site.entity';
import { MemberWorkCategory } from 'src/libs/entity/member-work-category.entity';

// Services
import { MainBannerService } from './services/main-banner.service';
import { HistoryService } from './services/history.service';
import { AwardService } from './services/award.service';
import { BranchService } from './services/branch.service';
import { GeocodingService } from './services/geocoding.service';
import { KeyCustomerService } from './services/key-customer.service';
import { BusinessAreaService } from './services/business-area.service';
import { TrainingSeminarService } from './services/training-seminar.service';
import { CategoryService } from './services/category.service';
import { TaxMemberService } from './services/tax-member.service';
import { ExposureSettingsService } from './services/exposure-settings.service';
import { InsightsService } from './services/insights.service';
import { AttachmentService } from './services/attachment.service';
import { FooterPolicyService } from './services/footer-policy.service';
import { FamilySiteService } from './services/family-site.service';
import { WorkAreasMigrationService } from './services/work-areas-migration.service';
import { PublicContentController } from './controllers/public-content.controller';
import { AttachmentsController } from './controllers/attachments.controller';

import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    MembersModule,
    TypeOrmModule.forFeature([
      MainBanner,
      HistoryYear,
      HistoryItem,
      AwardYear,
      Award,
      Branch,
      KeyCustomer,
      BusinessArea,
      TrainingSeminar,
      TrainingSeminarApplication,
      MajorCategory,
      MinorCategory,
      TaxMember,
      Member,
      ExposureSettings,
      InsightsCategory,
      InsightsSubcategory,
      InsightsItem,
      InsightsComment,
      InsightsCommentReport,
      Attachment,
      BusinessAreaCategory,
      FooterPolicy,
      FamilySite,
      MemberWorkCategory,
    ]),
  ],
  providers: [
    MainBannerService,
    HistoryService,
    AwardService,
    BranchService,
    GeocodingService,
    KeyCustomerService,
    BusinessAreaService,
    TrainingSeminarService,
    CategoryService,
    TaxMemberService,
    ExposureSettingsService,
    InsightsService,
    AttachmentService,
    FooterPolicyService,
    FamilySiteService,
    WorkAreasMigrationService,
  ],
  controllers: [PublicContentController, AttachmentsController],
  exports: [
    MainBannerService,
    HistoryService,
    AwardService,
    BranchService,
    KeyCustomerService,
    BusinessAreaService,
    TrainingSeminarService,
    CategoryService,
    TaxMemberService,
    ExposureSettingsService,
    InsightsService,
    AttachmentService,
    FooterPolicyService,
    FamilySiteService,
    WorkAreasMigrationService,
  ],
})
export class ContentModule { }





