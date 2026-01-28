import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDefined, IsNotEmpty, IsNumber, IsOptional, IsObject, IsString, MaxLength, IsArray, ArrayMaxSize } from 'class-validator';

export class CreateItemDto {
  @ApiProperty({ example: '2024년 세무 개편 사항', description: '아이템 제목' })
  @IsDefined({ message: '제목을 입력해주세요.' })
  @IsNotEmpty({ message: '제목을 입력해주세요.' })
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MaxLength(200, { message: '제목은 200자를 초과할 수 없습니다.' })
  title: string;

  @ApiProperty({ example: '본문 내용입니다...', description: '아이템 내용' })
  @IsDefined({ message: '내용을 입력해주세요.' })
  @IsNotEmpty({ message: '내용을 입력해주세요.' })
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  content: string;

  @ApiProperty({ example: 1, description: '카테고리 ID' })
  @IsDefined({ message: '카테고리를 선택해주세요.' })
  @IsNotEmpty({ message: '카테고리를 선택해주세요.' })
  @IsNumber({}, { message: '카테고리 ID는 숫자여야 합니다.' })
  categoryId: number;

  @ApiProperty({ example: 1, description: '서브카테고리 ID' })
  @IsDefined({ message: '서브카테고리를 선택해주세요.' })
  @IsNotEmpty({ message: '서브카테고리를 선택해주세요.' })
  @IsNumber({}, { message: '서브카테고리 ID는 숫자여야 합니다.' })
  subcategoryId: number;

  @ApiPropertyOptional({ 
    example: 1, 
    description: 'Business area category id where majorCategory === selected subcategory' 
  })
  @IsNotEmpty({ message: '서브카테고리를 선택해주세요.' })
  @IsNumber({}, { message: '서브마이너카테고리 ID는 숫자여야 합니다.' })
  subMinorCategoryId: number;

  @ApiProperty({
    example: { id: 10, url: 'https://example.com/thumbnail.jpg' },
    description: '썸네일 이미지 (필수)'
  })
  @IsDefined({ message: '썸네일을 업로드해주세요.' })
  @IsNotEmpty({ message: '썸네일을 업로드해주세요.' })
  @IsObject({ message: '썸네일 정보가 올바르지 않습니다.' })
  thumbnail: { id: number; url: string };

  @ApiProperty({
    example: [
      { id: 113 },
      { id: 114 }
    ],
    description: '첨부 파일 배열 (필수) - 파일 ID 배열 (IMAGE, PDF, VIDEO 등)'
  })
  @IsDefined({ message: '파일을 업로드해주세요.' })
  @IsOptional()
  @IsArray({ message: '파일은 배열이어야 합니다.' })
  @ArrayMaxSize(100, { message: '최대 100개의 파일을 업로드할 수 있습니다.' })
  files: Array<{ id: number } | { id: number; url?: string; type?: string }>;

  @ApiPropertyOptional({ example: true, description: '메인 노출 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isMainExposed?: boolean;

  @ApiPropertyOptional({ example: true, description: '노출 여부', default: true })
  @IsOptional()
  @IsBoolean()
  isExposed?: boolean;

  @ApiPropertyOptional({ example: false, description: '댓글 허용 여부', default: false })
  @IsOptional()
  @IsBoolean()
  enableComments?: boolean;

}








