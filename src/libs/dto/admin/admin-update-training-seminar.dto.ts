import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsInt, Min, IsBoolean, ValidateIf, IsArray, ArrayMinSize, IsObject } from 'class-validator';
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

  @ApiPropertyOptional({
    example: { id: 10, url: 'https://example.com/image.jpg' },
    description: '이미지'
  })
  @IsOptional()
  @IsObject({ message: '이미지 정보가 올바르지 않습니다.' })
  image?: { id: number; url: string } | null;

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

  @ApiPropertyOptional({
    example: ['2025.12.20', '2025.12.22', '2025.12.25', '2025.12.26'],
    description: '교육 일자 (다중 선택 가능, YYYY.MM.DD 또는 YYYY-MM-DD 형식 배열)'
  })
  @IsOptional()
  @IsArray({ message: '교육 일자는 배열 형식이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 교육 일자를 선택해주세요.' })
  @IsString({ each: true, message: '각 교육 일자는 문자열 형식이어야 합니다.' })
  educationDates?: string[];

  @ApiPropertyOptional({
    example: ['11:00-12:00', '14:00-15:00', '17:00-18:00'],
    description: '교육 시간 슬롯 (다중 선택 가능, HH:mm-HH:mm 형식 배열)'
  })
  @IsOptional()
  @IsArray({ message: '교육 시간 슬롯은 배열 형식이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 교육 시간 슬롯을 선택해주세요.' })
  @IsString({ each: true, message: '각 교육 시간 슬롯은 문자열 형식이어야 합니다.' })
  educationTimeSlots?: string[];

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

  @ApiPropertyOptional({ example: 'https://vimeo.com/123456789', description: 'Vimeo 비디오 URL' })
  @IsOptional()
  @IsString()
  vimeoVideoUrl?: string;
}
