import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateItemDto {
  @ApiPropertyOptional({ example: '2024년 세무 개편 사항', description: '아이템 제목' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'https://example.com/thumbnail.jpg', description: '썸네일 URL' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: '본문 내용입니다...', description: '아이템 내용' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 1, description: '카테고리 ID' })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: '서브카테고리 ID' })
  @IsOptional()
  @IsNumber()
  subcategoryId?: number;

  @ApiPropertyOptional({ example: false, description: '댓글 허용 여부' })
  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @ApiPropertyOptional({ example: 'N', description: '댓글 라벨' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  commentsLabel?: string;

  @ApiPropertyOptional({ example: true, description: '노출 여부' })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: 'Y', description: '노출 라벨' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  exposedLabel?: string;
}




