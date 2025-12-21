import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from 'src/libs/dto/consultation/create-consultation.dto';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { MembersService } from '../members/members.service';
import { MemberFlag } from 'src/libs/enums/members.enum';

@ApiTags('Consultations')
@Controller('consultations')
export class ConsultationsController {
  constructor(
    private readonly consultationsService: ConsultationsService,
    private readonly jwtService: JwtService,
    private readonly membersService: MembersService,
  ) {}

  @ApiOperation({ summary: '상담 신청 작성' })
  @ApiResponse({ status: 201, description: '상담 신청 성공' })
  @ApiResponse({ status: 400, description: '입력값 검증 실패' })
  @ApiBody({ type: CreateConsultationDto })
  @Post()
  async create(@Req() req: Request, @Body() dto: CreateConsultationDto) {
    let memberId: number | null = null;

    const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        try {
          const payload: any = await this.jwtService.verifyAsync(token);
          if (payload?.sub) {
            const member = await this.membersService.findById(payload.sub);
            memberId = member.id;
          }
        } catch {
          // 토큰이 유효하지 않은 경우에는 비회원으로 처리
          memberId = null;
        }
      }
    }

    return this.consultationsService.create({
      ...dto,
      memberId,
      memberFlag: memberId ? MemberFlag.MEMBER : MemberFlag.NON_MEMBER,
    });
  }
}
