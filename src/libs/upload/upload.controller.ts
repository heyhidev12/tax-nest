import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { imageUploadConfig } from './config/multer.config';
import { ImageUploadDto } from 'src/libs/dto/upload/image-upload.dto';
import { ImageUploadResponseDto } from 'src/libs/dto/upload/image-upload-response.dto';
import { GenerateVideoPresignedUrlDto } from 'src/libs/dto/upload/generate-video-presigned-url.dto';
import { VideoPresignedUrlResponseDto } from 'src/libs/dto/upload/video-presigned-url-response.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', imageUploadConfig))
  @ApiOperation({
    summary: 'Upload image file',
    description: 'Upload an image file (jpg, png, webp) to AWS S3. Maximum file size: 5MB. The file is uploaded through the backend and returns the public S3 URL that should be saved in your database.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload',
    type: ImageUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully. Returns the S3 URL that should be saved in MySQL.',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size exceeded. Allowed types: jpg, png, webp. Maximum size: 5MB.',
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const result = await this.uploadService.uploadImage(file);

    return {
      url: result.url,
      key: result.key,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Post('video/presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned URL for video upload',
    description:
      'Generate a presigned URL for uploading a video (mp4, mov) directly to S3. The URL expires in 5 minutes. The client should use this presigned URL with a PUT request to upload the video directly to S3 (not through this backend). After upload, save the returned URL to your MySQL database.',
  })
  @ApiBody({
    description: 'Video file information',
    type: GenerateVideoPresignedUrlDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URL generated successfully. Use the presignedUrl with PUT method to upload video. Save the url field to MySQL after upload.',
    type: VideoPresignedUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file name or content type. Allowed types: video/mp4, video/quicktime (mov).',
  })
  async generateVideoPresignedUrl(
    @Body() dto: GenerateVideoPresignedUrlDto,
  ): Promise<VideoPresignedUrlResponseDto> {
    return this.uploadService.generateVideoPresignedUrl(dto.fileName, dto.contentType);
  }
}
