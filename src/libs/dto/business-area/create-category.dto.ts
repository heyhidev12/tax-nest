import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

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

  @ApiProperty({ example: true, description: '노출 여부', default: true, required: false })
  @IsOptional()
  isExposed?: boolean;
}

