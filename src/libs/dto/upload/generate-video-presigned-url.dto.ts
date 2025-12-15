import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class GenerateVideoPresignedUrlDto {
  @ApiProperty({
    example: 'my-video.mp4',
    description: 'Video file name',
  })
  @IsNotEmpty({ message: 'File name is required' })
  @IsString()
  fileName: string;

  @ApiProperty({
    example: 'video/mp4',
    description: 'Video MIME type',
    enum: ['video/mp4', 'video/quicktime'],
  })
  @IsNotEmpty({ message: 'Content type is required' })
  @IsString()
  @IsIn(['video/mp4', 'video/quicktime'], {
    message: 'Content type must be either video/mp4 or video/quicktime',
  })
  contentType: string;
}
