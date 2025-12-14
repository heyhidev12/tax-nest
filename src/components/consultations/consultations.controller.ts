import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from 'src/libs/dto/consultation/create-consultation.dto';

@ApiTags('Consultations')
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @ApiOperation({ summary: '상담 신청 작성' })
  @ApiResponse({ status: 201, description: '상담 신청 성공' })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @ApiBody({ type: CreateConsultationDto })
  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }
}
