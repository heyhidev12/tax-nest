import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, ValidateNested } from 'class-validator';

export class HistoryYearOrderItemDto {
  @ApiProperty({ example: 1, description: '연도 ID', type: Number })
  @IsInt()
  id: number;

  @ApiProperty({ example: 1, description: '표시 순서', type: Number })
  @IsInt()
  displayOrder: number;
}

export class UpdateHistoryYearOrderDto {
  @ApiProperty({
    type: [HistoryYearOrderItemDto],
    description: '연도 순서 정보 배열',
    example: [
      { id: 2, displayOrder: 1 },
      { id: 3, displayOrder: 2 },
      { id: 1, displayOrder: 3 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryYearOrderItemDto)
  items: HistoryYearOrderItemDto[];
}
