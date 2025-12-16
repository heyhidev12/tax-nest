import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
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

export class CreateBusinessAreaItemDto {
  @ApiProperty({ example: '전기·전자·반도체 제조업', description: '업무분야명' })
  @IsNotEmpty({ message: '업무분야명을 입력해주세요.' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '부제목', description: '부제목' })
  @IsOptional()
  @IsString()
  subDescription?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: '대표 이미지 URL' })
  @IsNotEmpty({ message: '대표 이미지 URL을 입력해주세요.' })
  @IsString()
  imageUrl: string;

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

  @ApiProperty({ example: '<p>본문 HTML</p>', description: '본문 HTML' })
  @IsNotEmpty({ message: '본문을 입력해주세요.' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xxx', description: 'YouTube URL' })
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiPropertyOptional({ example: true, description: '메인 노출 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isMainExposed?: boolean;

  @ApiPropertyOptional({ example: true, description: '노출 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 0, description: '표시 순서', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

