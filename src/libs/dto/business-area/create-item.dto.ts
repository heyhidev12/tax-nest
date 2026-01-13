import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested, IsArray, ArrayMinSize, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Major Category object structure (from InsightsSubcategory)
 */
export class MajorCategoryDto {
  @ApiProperty({ example: 1, description: 'Major Category ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ example: '업종별', description: 'Major Category name' })
  @IsString()
  name: string;

  // Add other InsightsSubcategory fields if needed
  sections?: string[];
  isExposed?: boolean;
  displayOrder?: number;
}

/**
 * Minor Category object structure (from BusinessAreaCategory)
 */
export class MinorCategoryDto {
  @ApiProperty({ example: 1, description: 'Minor Category ID' })
  @IsNumber()
  id: number;

  @ApiProperty({ example: '제조업', description: 'Minor Category name' })
  @IsString()
  name: string;

  // Add other BusinessAreaCategory fields if needed
  isExposed?: boolean;
}

/**
 * Section content structure
 */
export class SectionContentDto {
  @ApiProperty({ example: '발생원인', description: 'Section name (must match a section from majorCategory)' })
  @IsNotEmpty({ message: '섹션명을 입력해주세요.' })
  @IsString()
  section: string;

  @ApiProperty({ example: '<p>HTML content for this section</p>', description: 'HTML content for this section' })
  @IsNotEmpty({ message: '섹션 본문을 입력해주세요.' })
  @IsString()
  content: string;
}

export class CreateBusinessAreaItemDto {
  @ApiProperty({ example: '전기·전자·반도체 제조업', description: '업무분야명' })
  @IsNotEmpty({ message: '업무분야명을 입력해주세요.' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '부제목', description: '부제목' })
  @IsOptional()
  @IsString()
  subDescription?: string;

  @ApiProperty({
    example: { id: 10, url: 'https://example.com/image.jpg' },
    description: '대표 이미지'
  })
  @IsNotEmpty({ message: '대표 이미지를 업로드해주세요.' })
  @IsObject({ message: '이미지 정보가 올바르지 않습니다.' })
  image: { id: number; url: string };

  @ApiProperty({ 
    description: 'Major Category (from InsightsSubcategory)', 
    type: MajorCategoryDto 
  })
  @IsNotEmpty({ message: 'Major Category를 선택해주세요.' })
  @IsObject()
  @ValidateNested()
  @Type(() => MajorCategoryDto)
  majorCategory: MajorCategoryDto;

  @ApiProperty({ 
    description: 'Minor Category (Business Area Category)', 
    type: MinorCategoryDto 
  })
  @IsNotEmpty({ message: 'Minor Category를 선택해주세요.' })
  @IsObject()
  @ValidateNested()
  @Type(() => MinorCategoryDto)
  minorCategory: MinorCategoryDto;

  @ApiProperty({ example: '개요 내용', description: '개요' })
  @IsNotEmpty({ message: '개요를 입력해주세요.' })
  @IsString()
  overview: string;


  @ApiProperty({ 
    description: 'Section-based content array. Each section from the majorCategory should have its own content block.',
    example: [
      { section: '발생원인', content: '<p>Content for 발생원인 section</p>' },
      { section: '리스크', content: '<p>Content for 리스크 section</p>' },
      { section: '체크포인트', content: '<p>Content for 체크포인트 section</p>' }
    ],
    type: [Object]
  })
  @IsNotEmpty({ message: '섹션별 본문을 입력해주세요.' })
  @IsArray({ message: 'sectionContents는 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 하나의 섹션 본문이 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => SectionContentDto)
  sectionContents: SectionContentDto[];

  @ApiPropertyOptional({ 
    example: ['https://www.youtube.com/watch?v=xxxx', 'https://youtu.be/yyyy'], 
    description: 'YouTube URLs array (optional, empty array allowed)',
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'youtubeUrls는 배열이어야 합니다.' })
  @IsUrl({}, { each: true, message: '올바른 YouTube URL 형식이 아닙니다.' })
  youtubeUrls?: string[];

  @ApiPropertyOptional({ example: true, description: '노출 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 0, description: '표시 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

