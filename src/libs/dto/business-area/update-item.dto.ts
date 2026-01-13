import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, ValidateNested, IsArray, ArrayMinSize, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { MajorCategoryDto, MinorCategoryDto, SectionContentDto } from './create-item.dto';

export class UpdateBusinessAreaItemDto {
  @ApiPropertyOptional({ example: '전기·전자·반도체 제조업', description: '업무분야명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '부제목', description: '부제목' })
  @IsOptional()
  @IsString()
  subDescription?: string;

  @ApiPropertyOptional({
    example: { id: 10, url: 'https://example.com/image.jpg' },
    description: '대표 이미지'
  })
  @IsOptional()
  @IsObject({ message: '이미지 정보가 올바르지 않습니다.' })
  image?: { id: number; url: string };

  @ApiPropertyOptional({ 
    description: 'Major Category (from InsightsSubcategory)', 
    type: MajorCategoryDto 
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MajorCategoryDto)
  majorCategory?: MajorCategoryDto;

  @ApiPropertyOptional({ 
    description: 'Minor Category (Business Area Category)', 
    type: MinorCategoryDto 
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MinorCategoryDto)
  minorCategory?: MinorCategoryDto;

  @ApiPropertyOptional({ example: '개요 내용', description: '개요' })
  @IsOptional()
  @IsString()
  overview?: string;

  @ApiPropertyOptional({ 
    example: '<p>본문 HTML</p>', 
    description: '본문 HTML (deprecated - use sectionContents instead)' 
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ 
    description: 'Section-based content array. Each section from the majorCategory should have its own content block.',
    example: [
      { section: '발생원인', content: '<p>Content for 발생원인 section</p>' },
      { section: '리스크', content: '<p>Content for 리스크 section</p>' },
      { section: '체크포인트', content: '<p>Content for 체크포인트 section</p>' }
    ],
    type: [Object]
  })
  @IsOptional()
  @IsArray({ message: 'sectionContents는 배열이어야 합니다.' })
  @ArrayMinSize(1, { message: '최소 하나의 섹션 본문이 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => SectionContentDto)
  sectionContents?: SectionContentDto[];

  @ApiPropertyOptional({ 
    example: ['https://www.youtube.com/watch?v=xxxx', 'https://youtu.be/yyyy'], 
    description: 'YouTube URLs array (optional, empty array allowed)',
    type: [String]
  })
  @IsOptional()
  @IsArray({ message: 'youtubeUrls는 배열이어야 합니다.' })
  @IsUrl({}, { each: true, message: '올바른 YouTube URL 형식이 아닙니다.' })
  youtubeUrls?: string[];

  @ApiPropertyOptional({ example: true, description: '노출 여부' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 0, description: '표시 순서' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

