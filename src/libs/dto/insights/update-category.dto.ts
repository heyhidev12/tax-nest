import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType } from 'src/libs/entity/insights-category.entity';

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: '세무 인사이트', description: '카테고리 이름' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'A', enum: CategoryType, description: '카테고리 타입 (A, B, C)' })
  @IsOptional()
  @IsEnum(CategoryType, { message: '카테고리 타입은 A, B, C 중 하나여야 합니다.' })
  type?: CategoryType;
}









