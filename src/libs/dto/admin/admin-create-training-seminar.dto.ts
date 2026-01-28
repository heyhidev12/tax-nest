import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, IsInt, Min, IsBoolean, ValidateIf, IsArray, ArrayMinSize, IsObject } from 'class-validator';
import { TrainingSeminarType, RecruitmentType, TargetMemberType } from 'src/libs/entity/training-seminar.entity';

export class AdminCreateTrainingSeminarDto {
  @ApiProperty({ example: '세무 교육 세미나', description: '교육/세미나 명 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '교육/세미나 명을 입력해주세요.' })
  name: string;

  @ApiProperty({ example: 'SEMINAR', enum: TrainingSeminarType, description: '교육/세미나 유형 (필수: VOD, SEMINAR, TRAINING, LECTURE)' })
  @IsEnum(TrainingSeminarType, { message: '올바른 교육/세미나 유형을 선택해주세요.' })
  @IsNotEmpty({ message: '교육/세미나 유형을 선택해주세요.' })
  type: TrainingSeminarType;

  @ApiProperty({ example: 'FIRST_COME', enum: RecruitmentType, description: '모집 유형 (필수: FIRST_COME: 선착순, SELECTION: 선정)' })
  @IsEnum(RecruitmentType, { message: '올바른 모집 유형을 선택해주세요.' })
  @IsNotEmpty({ message: '모집 유형을 선택해주세요.' })
  recruitmentType: RecruitmentType;

  @ApiProperty({ example: '2026.06.30', description: '모집 종료일 (필수, YYYY.MM.DD 또는 YYYY-MM-DD 형식)' })
  @IsString()
  @IsNotEmpty({ message: '모집 종료일을 입력해주세요.' })
  recruitmentEndDate: string;

  @ApiProperty({ example: 'ALL', enum: TargetMemberType, description: '회원 유형 (필수: ALL: 전체, GENERAL: 일반, INSURANCE: 보험사, OTHER: 기타)' })
  @IsEnum(TargetMemberType, { message: '올바른 회원 유형을 선택해주세요.' })
  @IsNotEmpty({ message: '회원 유형을 선택해주세요.' })
  targetMemberType: TargetMemberType;

  @ApiPropertyOptional({
    example: { id: 10, url: 'https://example.com/image.jpg' },
    description: '이미지 (선택)'
  })
  @IsOptional()
  @IsObject({ message: '이미지 정보가 올바르지 않습니다.' })
  image?: { id: number; url: string };

  @ApiPropertyOptional({ example: '김세무', description: '강사명 (선택)' })
  @IsOptional()
  @IsString()
  instructorName?: string;

  @ApiPropertyOptional({ example: '세무사, 회계사', description: '대상 (선택)' })
  @IsOptional()
  @IsString()
  target?: string;

  @ApiProperty({ example: '<p>본문 내용입니다.</p>', description: '본문 (필수, HTML)' })
  @IsString()
  @IsNotEmpty({ message: '본문을 입력해주세요.' })
  body: string;

  @ApiProperty({
    example: ['2025.12.20', '2025.12.22', '2025.12.25', '2025.12.26'],
    description: '교육 일자 (필수, 다중 선택 가능, YYYY.MM.DD 또는 YYYY-MM-DD 형식 배열)'
  })
  @IsArray({ message: '교육 일자는 배열 형식이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 교육 일자를 선택해주세요.' })
  @IsString({ each: true, message: '각 교육 일자는 문자열 형식이어야 합니다.' })
  @IsNotEmpty({ message: '교육 일자를 입력해주세요.' })
  educationDates: string[];

  @ApiProperty({
    example: ['11:00-12:00', '14:00-15:00', '17:00-18:00'],
    description: '교육 시간 슬롯 (필수, 다중 선택 가능, HH:mm-HH:mm 형식 배열)'
  })
  @IsArray({ message: '교육 시간 슬롯은 배열 형식이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 1개 이상의 교육 시간 슬롯을 선택해주세요.' })
  @IsString({ each: true, message: '각 교육 시간 슬롯은 문자열 형식이어야 합니다.' })
  @IsNotEmpty({ message: '교육 시간 슬롯을 입력해주세요.' })
  educationTimeSlots: string[];

  @ApiPropertyOptional({ example: '서울시 강남구', description: '교육 장소 (선택)' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: '기타 정보', description: '기타 입력란 (선택)' })
  @IsOptional()
  @IsString()
  otherInfo?: string;

  // 모집 유형이 '선착순'일 경우 정원 필수
  @ApiPropertyOptional({ example: 50, description: '모집 정원 (선착순일 경우 필수)' })
  @ValidateIf((o) => o.recruitmentType === 'FIRST_COME')
  @IsInt({ message: '정원은 숫자여야 합니다.' })
  @Min(1, { message: '정원은 최소 1명 이상이어야 합니다.' })
  quota?: number;

  @ApiPropertyOptional({ example: 0, description: '가격 (기본: 0, 최소: 0)' })
  @IsOptional()
  @IsInt({ message: '가격은 숫자여야 합니다.' })
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  price?: number = 0;

  @ApiPropertyOptional({ example: true, description: '노출 여부 (기본: true)' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean = true;

  @ApiPropertyOptional({ example: false, description: '추천 세미나 여부 (기본: false)' })
  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean = false;

  @ApiPropertyOptional({ example: 'https://vimeo.com/123456789', description: 'Vimeo 비디오 URL (선택)' })
  @IsOptional()
  @IsString()
  vimeoVideoUrl?: string;
}
