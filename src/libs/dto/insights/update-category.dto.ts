import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryType } from 'src/libs/entity/insights-category.entity';
import { TargetMemberType } from 'src/libs/entity/training-seminar.entity';

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

  @ApiProperty({ example: 'ALL', enum: TargetMemberType, description: '대상 회원 유형 (ALL: 전체, GENERAL: 일반, INSURANCE: 보험사, OTHER: 기타)' })
  @IsNotEmpty({ message: '대상 회원 유형을 선택해주세요.' })
  @IsEnum(TargetMemberType, { message: '올바른 대상 회원 유형을 선택해주세요.' })
  targetMemberType: TargetMemberType;
}











