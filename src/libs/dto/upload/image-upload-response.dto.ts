import { ApiProperty } from '@nestjs/swagger';

export class ImageUploadResponseDto {
  @ApiProperty({
    example: 'https://my-bucket.s3.ap-northeast-2.amazonaws.com/uploads/images/1234567890-image.jpg',
    description: 'Public S3 URL of the uploaded image',
  })
  url: string;

  @ApiProperty({
    example: 'uploads/images/1234567890-image.jpg',
    description: 'S3 object key (path) of the uploaded image',
  })
  key: string;

  @ApiProperty({
    example: 'image.jpg',
    description: 'Original file name',
  })
  originalName?: string;

  @ApiProperty({
    example: 102400,
    description: 'File size in bytes',
  })
  size?: number;
}
