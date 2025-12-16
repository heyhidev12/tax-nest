import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MajorCategoryDto, MinorCategoryDto } from './create-item.dto';

export class UpdateBusinessAreaItemDto {
  @ApiPropertyOptional({ example: '전기·전자·반도체 제조업', description: '업무분야명' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '부제목', description: '부제목' })
  @IsOptional()
  @IsString()
  subDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: '대표 이미지 URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

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

  @ApiPropertyOptional({ example: '<p>본문 HTML</p>', description: '본문 HTML' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xxx', description: 'YouTube URL' })
  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @ApiPropertyOptional({ example: true, description: '메인 노출 여부' })
  @IsOptional()
  @IsBoolean()
  isMainExposed?: boolean;

  @ApiPropertyOptional({ example: true, description: '노출 여부' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 0, description: '표시 순서' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

