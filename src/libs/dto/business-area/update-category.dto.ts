import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ImageDto {
  @ApiPropertyOptional({ example: 1, description: 'Image ID' })
  @IsOptional()
  @IsNumber()
  id: number;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Image URL' })
  @IsOptional()
  @IsString()
  url: string;
}

export class UpdateBusinessAreaCategoryDto {
  @ApiPropertyOptional({ example: '제조업', description: 'Category name' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ 
    example: { id: 1, url: 'https://example.com/image.jpg' }, 
    description: 'Category image',
    type: () => ImageDto
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ImageDto)
  image?: { id: number; url: string };

  @ApiPropertyOptional({ example: true, description: '노출 여부' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: false, description: '메인 노출 여부' })
  @IsOptional()
  @IsBoolean()
  isMainExposed?: boolean;
}

