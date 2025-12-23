import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CategoryType } from 'src/libs/entity/insights-category.entity';

export class CreateCategoryDto {
  @ApiProperty({ example: '세무 인사이트', description: '카테고리 이름' })
  @IsNotEmpty({ message: '카테고리 이름을 입력해주세요.' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'A', enum: CategoryType, description: '카테고리 타입 (A, B, C)' })
  @IsNotEmpty({ message: '카테고리 타입을 선택해주세요.' })
  @IsEnum(CategoryType, { message: '카테고리 타입은 A, B, C 중 하나여야 합니다.' })
  type: CategoryType;
}




