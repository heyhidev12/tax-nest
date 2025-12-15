import { ApiProperty } from '@nestjs/swagger';

export class VideoPresignedUrlResponseDto {
  @ApiProperty({
    example: 'https://my-bucket.s3.ap-northeast-2.amazonaws.com/uploads/videos/1234567890-video.mp4?X-Amz-Algorithm=...',
    description: 'Presigned URL for uploading video to S3 (expires in 5 minutes)',
  })
  presignedUrl: string;

  @ApiProperty({
    example: 'https://my-bucket.s3.ap-northeast-2.amazonaws.com/uploads/videos/1234567890-video.mp4',
    description: 'Public S3 URL that will be accessible after upload',
  })
  url: string;

  @ApiProperty({
    example: 'uploads/videos/1234567890-video.mp4',
    description: 'S3 object key (path) where the video will be stored',
  })
  key: string;

  @ApiProperty({
    example: 300,
    description: 'Presigned URL expiration time in seconds (5 minutes)',
  })
  expiresIn: number;
}
