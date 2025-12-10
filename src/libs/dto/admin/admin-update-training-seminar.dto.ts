import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, IsBoolean, ValidateIf } from 'class-validator';
import { TrainingSeminarType, RecruitmentType, TargetMemberType } from 'src/libs/entity/training-seminar.entity';

export class AdminUpdateTrainingSeminarDto {
  @ApiPropertyOptional({ example: '세무 교육 세미나', description: '교육/세미나 명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'SEMINAR', enum: TrainingSeminarType, description: '교육/세미나 유형' })
  @IsOptional()
  @IsEnum(TrainingSeminarType)
  type?: TrainingSeminarType;

  @ApiPropertyOptional({ example: 'FIRST_COME', enum: RecruitmentType, description: '모집 유형' })
  @IsOptional()
  @IsEnum(RecruitmentType)
  recruitmentType?: RecruitmentType;

  @ApiPropertyOptional({ example: '2026.06.30', description: '모집 종료일 (YYYY.MM.DD 또는 YYYY-MM-DD 형식)' })
  @IsOptional()
  @IsString()
  recruitmentEndDate?: string;

  @ApiPropertyOptional({ example: 'ALL', enum: TargetMemberType, description: '회원 유형' })
  @IsOptional()
  @IsEnum(TargetMemberType)
  targetMemberType?: TargetMemberType;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: '이미지 URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: '김세무', description: '강사명' })
  @IsOptional()
  @IsString()
  instructorName?: string;

  @ApiPropertyOptional({ example: '세무사, 회계사', description: '대상' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiPropertyOptional({ example: '<p>본문 내용입니다.</p>', description: '본문 (HTML)' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: '2026-07-01', description: '교육 시작일 (YYYY-MM-DD 또는 YYYY.MM.DD 형식)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-03', description: '교육 종료일 (YYYY-MM-DD 또는 YYYY.MM.DD 형식)' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: '09:00-18:00', description: '교육 시간 (Text)' })
  @IsOptional()
  @IsString()
  educationTime?: string;

  @ApiPropertyOptional({ example: '14:00-16:00', description: '참여 시간 (HH:mm-HH:mm 형식)' })
  @IsOptional()
  @IsString()
  participationTime?: string;

  @ApiPropertyOptional({ example: '서울시 강남구', description: '교육 장소' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '기타 정보', description: '기타 입력란' })
  @IsOptional()
  @IsString()
  otherInfo?: string;

  @ApiPropertyOptional({ example: 50, description: '모집 정원' })
  @IsOptional()
  @IsInt({ message: '정원은 숫자여야 합니다.' })
  @Min(1, { message: '정원은 최소 1명 이상이어야 합니다.' })
  quota?: number;

  @ApiPropertyOptional({ example: true, description: '노출 여부' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: false, description: '추천 세미나 여부' })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;
}
