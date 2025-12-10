import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class AdminTaxMemberQueryDto {
  @ApiPropertyOptional({ example: '홍길동', description: '보험사명(소속명) 또는 구성원명 검색' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: '세무조정', description: '업무분야 필터' })
  @IsOptional()
  @IsString()
  workArea?: string;

  @ApiPropertyOptional({ example: true, description: '노출 여부 필터' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 'latest', enum: ['latest', 'oldest', 'order'], description: '정렬 (기본: order - 순서순)' })
  @IsOptional()
  @IsString()
  sort?: 'latest' | 'oldest' | 'order';

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
