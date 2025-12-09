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
import { ColumnArticle } from 'src/libs/entity/column.entity';
import { DataRoom, DataRoomContent, DataRoomComment } from 'src/libs/entity/data-room.entity';
import { MajorCategory, MinorCategory } from 'src/libs/entity/category.entity';
import { TaxMember } from 'src/libs/entity/tax-member.entity';
import { ExposureSettings } from 'src/libs/entity/exposure-settings.entity';

// Services
import { MainBannerService } from './services/main-banner.service';
import { HistoryService } from './services/history.service';
import { AwardService } from './services/award.service';
import { BranchService } from './services/branch.service';
import { KeyCustomerService } from './services/key-customer.service';
import { BusinessAreaService } from './services/business-area.service';
import { TrainingSeminarService } from './services/training-seminar.service';
import { ColumnService } from './services/column.service';
import { DataRoomService } from './services/data-room.service';
import { CategoryService } from './services/category.service';
import { TaxMemberService } from './services/tax-member.service';
import { ExposureSettingsService } from './services/exposure-settings.service';

@Module({
  imports: [
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
      ColumnArticle,
      DataRoom,
      DataRoomContent,
      DataRoomComment,
      MajorCategory,
      MinorCategory,
      TaxMember,
      ExposureSettings,
    ]),
  ],
  providers: [
    MainBannerService,
    HistoryService,
    AwardService,
    BranchService,
    KeyCustomerService,
    BusinessAreaService,
    TrainingSeminarService,
    ColumnService,
    DataRoomService,
    CategoryService,
    TaxMemberService,
    ExposureSettingsService,
  ],
  exports: [
    MainBannerService,
    HistoryService,
    AwardService,
    BranchService,
    KeyCustomerService,
    BusinessAreaService,
    TrainingSeminarService,
    ColumnService,
    DataRoomService,
    CategoryService,
    TaxMemberService,
    ExposureSettingsService,
  ],
})
export class ContentModule {}





