import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConsultationsService } from 'src/components/consultations/consultations.service';
import { AdminJwtAuthGuard } from '../admin-jwt.guard';
import { AdminConsultationQueryDto } from 'src/libs/dto/admin/admin-consultation-query.dto';
import { AdminAnswerDto } from 'src/libs/dto/admin/admin-answer.dto';
import { AdminDeleteManyDto } from 'src/libs/dto/admin/admin-delete-many.dto';

@ApiTags('Admin Consultations')
@ApiBearerAuth('admin-auth')
@Controller('admin/consultations')
@UseGuards(AdminJwtAuthGuard)
export class AdminConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @ApiOperation({ summary: '상담 목록 조회' })
  @ApiResponse({ status: 200, description: '목록 조회 성공' })
  @Get()
  list(@Query() query: AdminConsultationQueryDto) {
    return this.consultationsService.adminList(query);
  }

  @ApiOperation({ summary: '상담 상세 조회' })
  @ApiResponse({ status: 200, description: '상세 조회 성공' })
  @ApiResponse({ status: 404, description: '상담 없음' })
  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultationsService.adminGetOne(id);
  }

  @ApiOperation({ summary: '상담 답변 작성' })
  @ApiResponse({ status: 200, description: '답변 작성 성공' })
  @Patch(':id/answer')
  setAnswer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminAnswerDto,
  ) {
    return this.consultationsService.adminSetAnswer(id, dto.answer, dto.status);
  }

  @ApiOperation({ summary: '상담 다중 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete('bulk')
  deleteMany(@Body() dto: AdminDeleteManyDto) {
    return this.consultationsService.adminDeleteMany(dto.ids);
  }

  @ApiOperation({ summary: '상담 단일 삭제' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @Delete(':id')
  deleteOne(@Param('id', ParseIntPipe) id: number) {
    return this.consultationsService.adminDeleteMany([id]);
  }
}

