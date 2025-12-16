import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: '2024년 세무 개편 사항', description: '아이템 제목' })
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg', description: '썸네일 URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ example: '본문 내용입니다...', description: '아이템 내용' })
  @IsNotEmpty({ message: '내용을 입력해주세요.' })
  @IsString()
  content: string;

  @ApiProperty({ example: 1, description: '카테고리 ID' })
  @IsNotEmpty({ message: '카테고리를 선택해주세요.' })
  @IsNumber()
  categoryId: number;

  @ApiProperty({ example: 1, description: '서브카테고리 ID' })
  @IsNotEmpty({ message: '서브카테고리를 선택해주세요.' })
  @IsNumber()
  subcategoryId: number;

  @ApiPropertyOptional({ example: false, description: '댓글 허용 여부', default: false })
  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @ApiPropertyOptional({ example: 'N', description: '댓글 라벨', default: 'N' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  commentsLabel?: string;

  @ApiPropertyOptional({ example: true, description: '노출 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 'Y', description: '노출 라벨', default: 'Y' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  exposedLabel?: string;
}


