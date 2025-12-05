import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { Consultation } from 'src/libs/entity/consultation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Consultation])],
  providers: [ConsultationsService],
  controllers: [ConsultationsController],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
