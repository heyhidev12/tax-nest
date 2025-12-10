import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TrainingSeminarType, RecruitmentType, TargetMemberType } from 'src/libs/entity/training-seminar.entity';

export class AdminTrainingSeminarQueryDto {
  @ApiPropertyOptional({ example: '세무 교육', description: '교육/세미나 명 검색' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'SEMINAR', enum: TrainingSeminarType, description: '교육/세미나 유형 필터 (VOD, SEMINAR, TRAINING, LECTURE)' })
  @IsOptional()
  @IsEnum(TrainingSeminarType)
  type?: TrainingSeminarType;

  @ApiPropertyOptional({ example: 'FIRST_COME', enum: RecruitmentType, description: '모집 유형 필터 (FIRST_COME: 선착순, SELECTION: 선정)' })
  @IsOptional()
  @IsEnum(RecruitmentType)
  recruitmentType?: RecruitmentType;

  @ApiPropertyOptional({ example: 'ALL', enum: TargetMemberType, description: '회원 유형 필터 (ALL: 전체, GENERAL: 일반, INSURANCE: 보험사, OTHER: 기타)' })
  @IsOptional()
  @IsEnum(TargetMemberType)
  targetMemberType?: TargetMemberType;

  @ApiPropertyOptional({ example: true, description: '노출 여부 필터' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isExposed?: boolean;

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
