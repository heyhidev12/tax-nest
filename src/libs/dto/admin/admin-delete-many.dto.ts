import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class AdminDeleteManyDto {
  @ApiProperty({ example: [1, 2, 3], description: '삭제할 ID 목록' })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  ids: number[];
}

