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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from 'src/libs/dto/consultation/create-consultation.dto';
import { CheckPasswordDto } from 'src/libs/dto/consultation/check-password.dto';

@ApiTags('Consultations')
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @ApiOperation({ summary: '상담 신청 작성' })
  @ApiResponse({ status: 201, description: '상담 신청 성공' })
  @Post()
  create(@Body() dto: CreateConsultationDto) {
    return this.consultationsService.create(dto);
  }

  @ApiOperation({ summary: '상담 목록 조회' })
  @ApiResponse({ status: 200, description: '상담 목록 조회 성공' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @Get()
  list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.consultationsService.list(Number(page), Number(limit));
  }

  @ApiOperation({ summary: '상담 상세 조회 (비밀번호 검증)' })
  @ApiResponse({ status: 200, description: '상담 상세 조회 성공' })
  @ApiResponse({ status: 401, description: '비밀번호 불일치' })
  @ApiResponse({ status: 404, description: '상담 요청 없음' })
  @Post(':id/detail')
  getDetail(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CheckPasswordDto,
  ) {
    return this.consultationsService.getDetailWithPassword(id, body.password);
  }

  @ApiOperation({ summary: '상담 삭제 (비밀번호 검증)' })
  @ApiResponse({ status: 200, description: '상담 삭제 성공' })
  @ApiResponse({ status: 401, description: '비밀번호 불일치' })
  @ApiResponse({ status: 404, description: '상담 요청 없음' })
  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CheckPasswordDto,
  ) {
    return this.consultationsService.deleteWithPassword(id, body.password);
  }
}
