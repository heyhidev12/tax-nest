import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MemberFlag } from 'src/libs/enums/members.enum';
import { ConsultationStatus } from 'src/libs/enums/consultations.enum';

export class AdminConsultationQueryDto {
  @ApiPropertyOptional({ example: '세무조정', description: '상담 분야 필터 (드롭다운)' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({ example: 'MEMBER', enum: MemberFlag, description: '회원/비회원 필터 (회원: MEMBER, 비회원: NON_MEMBER)' })
  @IsOptional()
  @IsEnum(MemberFlag)
  memberFlag?: MemberFlag;

  @ApiPropertyOptional({ example: 'PENDING', enum: ConsultationStatus, description: '진행 상태 필터' })
  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @ApiPropertyOptional({ example: '상담내용검색', description: '상담 내용 검색어' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'latest', enum: ['latest', 'oldest'], description: '정렬 (기본: latest - 최신순)' })
  @IsOptional()
  @IsString()
  sort?: 'latest' | 'oldest';

  @ApiPropertyOptional({ example: 1, description: '페이지 번호' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: '페이지당 항목 수' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
