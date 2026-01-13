import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from 'src/libs/entity/insights-category.entity';

export class SubcategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '업종별' })
  name: string;

  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiProperty({ example: true })
  isDefault: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '세무 인사이트' })
  name: string;

  @ApiProperty({ example: 'A', enum: CategoryType })
  type: CategoryType;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [SubcategoryResponseDto], required: false })
  subcategories?: SubcategoryResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}











