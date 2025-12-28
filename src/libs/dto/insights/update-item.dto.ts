import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDefined, IsNumber, IsOptional, IsObject, IsString, MaxLength, IsArray, ArrayMaxSize } from 'class-validator';

export class UpdateItemDto {
  @ApiPropertyOptional({ example: '2024년 세무 개편 사항', description: '아이템 제목' })
  @IsOptional()
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '제목은 200자를 초과할 수 없습니다.' })
  title?: string;

  @ApiPropertyOptional({ example: '본문 내용입니다...', description: '아이템 내용' })
  @IsOptional()
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  content?: string;

  @ApiPropertyOptional({ example: 1, description: '카테고리 ID' })
  @IsOptional()
  @IsNumber({}, { message: '카테고리 ID는 숫자여야 합니다.' })
  categoryId?: number;

  @ApiPropertyOptional({ example: 1, description: '서브카테고리 ID' })
  @IsOptional()
  @IsNumber({}, { message: '서브카테고리 ID는 숫자여야 합니다.' })
  subcategoryId?: number;

  @ApiPropertyOptional({
    example: { id: 10, url: 'https://example.com/thumbnail.jpg' },
    description: '썸네일 이미지'
  })
  @IsOptional()
  @IsObject({ message: '썸네일 정보가 올바르지 않습니다.' })
  thumbnail?: { id: number; url: string } | null;

  @ApiPropertyOptional({
    example: { id: 20, url: 'https://example.com/document.pdf' },
    description: 'PDF 파일'
  })
  @IsOptional()
  @IsObject({ message: 'PDF 파일 정보가 올바르지 않습니다.' })
  pdf?: { id: number; url: string } | null;

  @ApiPropertyOptional({ example: false, description: '댓글 허용 여부' })
  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

  @ApiPropertyOptional({ example: 'N', description: '댓글 라벨' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  commentsLabel?: string;

   @ApiPropertyOptional({ example: true, description: '메인 노출 여부' })
  @IsOptional()
  @IsBoolean()
  isMainExposed?: boolean;

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







