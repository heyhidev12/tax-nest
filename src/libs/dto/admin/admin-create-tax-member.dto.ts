import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class CategoryAssignmentDto {
  @ApiProperty({ example: 1, description: '카테고리 ID' })
  @IsInt()
  categoryId: number;

  @ApiProperty({ example: 1, description: '카테고리 내 표시 순서' })
  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class AdminCreateTaxMemberDto {
  @ApiProperty({ example: '홍길동', description: '구성원 명 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '구성원 명을 입력해주세요.' })
  name: string;

  @ApiProperty({
    example: { id: 10, url: 'https://example.com/main.jpg' },
    description: '구성원 메인 사진 (필수)'
  })
  @IsObject({ message: '메인 사진 정보가 올바르지 않습니다.' })
  @IsNotEmpty({ message: '구성원 메인 사진을 업로드해주세요.' })
  mainPhoto: { id: number; url: string };

  @ApiProperty({
    example: { id: 11, url: 'https://example.com/sub.jpg' },
    description: '구성원 서브 사진 (필수)'
  })
  @IsObject({ message: '서브 사진 정보가 올바르지 않습니다.' })
  @IsNotEmpty({ message: '구성원 서브 사진을 업로드해주세요.' })
  subPhoto: { id: number; url: string };

  @ApiProperty({
    type: [CategoryAssignmentDto],
    description: '카테고리 할당 목록 (무제한)',
    example: [
      { categoryId: 1, displayOrder: 1 },
      { categoryId: 2, displayOrder: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryAssignmentDto)
  @IsNotEmpty({ message: '카테고리를 선택해주세요.' })
  categories: CategoryAssignmentDto[];

  @ApiPropertyOptional({ example: '세무법인 투게더', description: '소속 명 (선택)' })
  @IsOptional()
  @IsString()
  affiliation?: string;

  @ApiPropertyOptional({ example: '01012345678', description: '휴대폰번호 (선택)' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'member@example.com', description: '이메일 (선택)' })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @ApiPropertyOptional({
    example: { id: 21, url: 'https://example.com/vcard.vcf' },
    description: 'V-Card 파일 (선택)'
  })
  @IsOptional()
  @IsObject({ message: 'V-Card 정보가 올바르지 않습니다.' })
  vcard?: { id: number; url: string };

  @ApiPropertyOptional({
    example: { id: 22, url: 'https://example.com/resume.pdf' },
    description: 'PDF 파일 (선택)'
  })
  @IsOptional()
  @IsObject({ message: 'PDF 정보가 올바르지 않습니다.' })
  pdf?: { id: number; url: string };

  @ApiProperty({ example: '세무 전문가입니다.', description: '한줄 소개 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '한줄 소개를 입력해주세요.' })
  oneLineIntro: string;

  @ApiProperty({ example: '세무 전문가로서 10년 이상의 경력을 보유하고 있습니다...', description: '전문가 소개 (필수)' })
  @IsString()
  @IsNotEmpty({ message: '전문가 소개를 입력해주세요.' })
  expertIntro: string;

  @ApiPropertyOptional({ example: '주요 처리사례 내용...', description: '주요 처리사례 (선택)' })
  @IsOptional()
  @IsString()
  mainCases?: string;

  @ApiPropertyOptional({ example: '서울대학교 경영학과 졸업', description: '학력 (선택)' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ example: '경력 및 수상 실적 내용...', description: '경력 및 수상 실적 (선택)' })
  @IsOptional()
  @IsString()
  careerAndAwards?: string;

  @ApiPropertyOptional({ example: '저서/활동/기타 내용...', description: '저서/활동/기타 (선택)' })
  @IsOptional()
  @IsString()
  booksActivitiesOther?: string;

  @ApiPropertyOptional({ example: true, description: '노출 여부 (기본: true)' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean = true;

  @ApiPropertyOptional({ example: 0, description: '표시 순서 (기본: 0)' })
  @IsOptional()
  displayOrder?: number = 0;
}
