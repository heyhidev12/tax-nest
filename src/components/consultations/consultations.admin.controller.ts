import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  Patch,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { AdminJwtAuthGuard } from '../admin-auth/admin-jwt.guard';
import { MemberFlag } from 'src/libs/enums/members.enum';
import { ConsultationStatus } from 'src/libs/enums/consultations.enum';

@Controller('admin/consultations')
@UseGuards(AdminJwtAuthGuard)
export class AdminConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  adminList(
    @Query('field') field?: string,
    @Query('memberFlag') memberFlag?: MemberFlag,
    @Query('search') search?: string,
    @Query('sort') sort: 'latest' | 'oldest' = 'latest',
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.consultationsService.adminList({
      field,
      memberFlag,
      search,
      sort,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(':id')
  adminDetail(@Param('id', ParseIntPipe) id: number) {
    return this.consultationsService.adminGetOne(id);
  }

  @Patch(':id/answer')
  setAnswer(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { answer: string; status?: ConsultationStatus },
  ) {
    return this.consultationsService.adminSetAnswer(
      id,
      body.answer,
      body.status ?? ConsultationStatus.COMPLETED,
    );
  }

  @Delete()
  deleteMany(@Body() body: { ids: number[] }) {
    return this.consultationsService.adminDeleteMany(body.ids);
  }
}
