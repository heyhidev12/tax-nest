import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, IsBoolean, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ImageDto {
  @ApiProperty({ example: 1, description: 'Image ID' })
  @IsNotEmpty({ message: '이미지 ID를 입력해주세요.' })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'https://example.com/image.jpg', description: 'Image URL' })
  @IsNotEmpty({ message: '이미지 URL을 입력해주세요.' })
  @IsString()
  url: string;
}

export class CreateBusinessAreaCategoryDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Major Category ID (from /admin/insights/subcategories - e.g., 업종별, 컨설팅)' 
  })
  @IsNotEmpty({ message: 'Major Category ID를 입력해주세요.' })
  @IsNumber()
  majorCategoryId: number;

  @ApiProperty({ example: '제조업', description: 'Category name (e.g., 제조업, IT서비스업)' })
  @IsNotEmpty({ message: '카테고리 이름을 입력해주세요.' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    example: { id: 1, url: 'https://example.com/image.jpg' }, 
    description: 'Category image (필수)',
    type: () => ImageDto
  })
  @IsNotEmpty({ message: '이미지를 입력해주세요.' })
  @IsObject()
  @ValidateNested()
  @Type(() => ImageDto)
  image: { id: number; url: string };

  @ApiProperty({ example: true, description: '노출 여부', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiProperty({ example: false, description: '메인 노출 여부', default: false, required: false })
  @IsOptional()
  @IsBoolean()
  isMainExposed?: boolean;
}

