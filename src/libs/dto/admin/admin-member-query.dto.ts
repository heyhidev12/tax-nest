import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MemberStatus, MemberType } from 'src/libs/enums/members.enum';

export class AdminMemberQueryDto {
  @ApiPropertyOptional({ example: '홍길동', description: '이름 또는 전화번호 검색' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'GENERAL', enum: MemberType, description: '회원 유형 필터' })
  @IsOptional()
  @IsEnum(MemberType)
  memberType?: MemberType;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: MemberStatus, description: '회원 상태 필터' })
  @IsOptional()
  @IsEnum(MemberStatus)
  status?: MemberStatus;

  @ApiPropertyOptional({ example: true, description: '승인 여부 필터' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isApproved?: boolean;

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

