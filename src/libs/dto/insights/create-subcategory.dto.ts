import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, ArrayNotEmpty, ValidateIf } from 'class-validator';
import { VALID_INSIGHTS_SECTIONS } from 'src/libs/enums/insights-sections.enum';

export class CreateSubcategoryDto {
  @ApiProperty({ example: '발생원인', description: '서브카테고리 이름' })
  @IsNotEmpty({ message: '서브카테고리 이름을 입력해주세요.' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ 
    example: ['발생원인', '리스크', '체크포인트'], 
    description: '섹션 배열 (발생원인, 리스크, 체크포인트, 함께 실행방안, 케이스 중 선택)',
    enum: VALID_INSIGHTS_SECTIONS,
    isArray: true,
  })
  @IsArray({ message: '섹션은 배열로 입력해주세요.' })
  @ArrayNotEmpty({ message: '최소 하나 이상의 섹션을 선택해주세요.' })
  @IsString({ each: true, message: '각 섹션은 문자열이어야 합니다.' })
  @IsIn(VALID_INSIGHTS_SECTIONS, { each: true, message: '유효하지 않은 섹션 값입니다. 발생원인, 리스크, 체크포인트, 함께 실행방안, 케이스 중에서 선택해주세요.' })
  sections: string[];

  @ApiProperty({ example: true, description: '노출 여부', default: true, required: false })
  @IsOptional()
  isExposed?: boolean;

  @ApiProperty({ example: 0, description: '표시 순서', default: 0, required: false })
  @IsOptional()
  displayOrder?: number;
}


