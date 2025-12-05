import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Delete,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from 'src/libs/dto/consultation/create-consultation.dto';
import { CheckPasswordDto } from 'src/libs/dto/consultation/check-password.dto';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  // 상담 신청 작성
  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  // 상담 게시판 리스트
  @Get()
  list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.consultationsService.list(Number(page), Number(limit));
  }

  // 비밀번호 검증 포함 상세 조회
  @Post(':id/detail')
  getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CheckPasswordDto,
  ) {
    return this.consultationsService.getDetailWithPassword(id, body.password);
  }

  // 비밀번호 검증 포함 삭제
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CheckPasswordDto,
  ) {
    return this.consultationsService.deleteWithPassword(id, body.password);
  }
}
