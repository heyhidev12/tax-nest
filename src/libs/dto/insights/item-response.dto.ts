import { ApiProperty } from '@nestjs/swagger';

export class ItemCategoryInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '세무 인사이트' })
  name: string;
}

export class ItemSubcategoryInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '업종별' })
  name: string;
}

export class ItemResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '2024년 세무 개편 사항' })
  title: string;

  @ApiProperty({
    example: { id: 10, url: 'https://example.com/thumbnail.jpg' },
    nullable: true
  })
  thumbnail: { id: number; url: string } | null;

  @ApiProperty({
    example: [
      { id: 113, url: 'https://example.com/document.pdf', type: 'PDF', fileName: 'file-113.pdf' },
      { id: 114, url: 'https://example.com/image.jpg', type: 'IMAGE', fileName: 'about1.png' },
    ],
    nullable: true,
    description: '첨부 파일 배열 - 여러 파일을 포함할 수 있습니다 (IMAGE, PDF, VIDEO 등)'
  })
  files?: Array<{ id: number; url: string; type: string; fileName: string }> | null;

  @ApiProperty({ example: '본문 내용입니다...' })
  content: string;

  @ApiProperty({ example: 1 })
  categoryId: number;

  @ApiProperty({ type: ItemCategoryInfoDto, required: false })
  category?: ItemCategoryInfoDto;

  @ApiProperty({ example: 1 })
  subcategoryId: number;

  @ApiProperty({ type: ItemSubcategoryInfoDto, required: false })
  subcategory?: ItemSubcategoryInfoDto;

  @ApiProperty({ example: false })
  enableComments: boolean;

  @ApiProperty({ example: 'N' })
  commentsLabel: string;

  @ApiProperty({ example: true })
  isExposed: boolean;

  @ApiProperty({ example: 'Y' })
  exposedLabel: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}







