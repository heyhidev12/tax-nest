import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, Min, ValidateNested } from 'class-validator';

export class CategoryOrderItemDto {
  @ApiProperty({ example: 1, description: '카테고리 ID' })
  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @ApiProperty({ example: 1, description: '표시 순서' })
  @IsInt()
  @Min(1)
  displayOrder: number;
}

export class UpdateCategoryOrderDto {
  @ApiProperty({ example: 1, description: 'Major Category ID' })
  @IsInt()
  @IsNotEmpty()
  majorCategoryId: number;

  @ApiProperty({
    type: [CategoryOrderItemDto],
    description: '카테고리 순서 배열',
    example: [
      { categoryId: 6, displayOrder: 1 },
      { categoryId: 2, displayOrder: 2 },
      { categoryId: 3, displayOrder: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryOrderItemDto)
  orders: CategoryOrderItemDto[];
}
