import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminBaseController } from './admin-base.controller';
import { AttachmentService } from 'src/components/content/services/attachment.service';
import { fileUploadConfig } from 'src/libs/upload/config/attachment-upload.config';
import { imageUploadConfig } from 'src/libs/upload/config/image-upload.config';
import { videoUploadConfig } from 'src/libs/upload/config/video-upload.config';
// DTOs removed - no longer needed for simple uploads

@ApiTags('Admin Uploads')
@Controller('admin/uploads')
export class AdminUploadsController extends AdminBaseController {
  constructor(private readonly attachmentService: AttachmentService) {
    super();
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', imageUploadConfig))
  @ApiOperation({
    summary: 'Upload image file',
    description: 'Upload an image file (jpeg, png, webp) to AWS S3. No file size limit. Returns public URL for use in forms.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload (jpeg, png, webp, no size limit)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image uploaded successfully. Returns attachment ID, URL and metadata.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Attachment database ID' },
        url: { type: 'string', description: 'Public URL of uploaded image' },
        fileName: { type: 'string', description: 'Original file name' },
        type: { type: 'string', example: 'IMAGE' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type. Allowed types: jpeg, png, webp.',
  })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    const result = await this.attachmentService.uploadImageSimple(file);

    return result;
  }

  @Post('file')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', fileUploadConfig))
  @ApiOperation({
    summary: 'Upload file (PDF, Docs, ZIP, V-Card, etc.)',
    description: 'Upload a file (PDF, Word, Excel, PowerPoint, ZIP, V-Card, etc.) to AWS S3. No file size limit. Returns public URL for use in forms.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload (pdf, msword, vnd.*, zip, no size limit)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully. Returns attachment ID, URL and metadata.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Attachment database ID' },
        url: { type: 'string', description: 'Public URL of uploaded file' },
        fileName: { type: 'string', description: 'Original file name' },
        type: { type: 'string', example: 'FILE' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type. Allowed types: pdf, msword, vnd.*, zip.',
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    const result = await this.attachmentService.uploadFileSimple(file);

    return result;
  }

  @Post('video')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', videoUploadConfig))
  @ApiOperation({
    summary: 'Upload video file',
    description: 'Upload a video file (mp4, mov) to AWS S3. No file size limit. Returns public URL for use in forms.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Video file upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Video file to upload (mp4, mov, no size limit)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video uploaded successfully. Returns attachment ID, URL and metadata.',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Attachment database ID' },
        url: { type: 'string', description: 'Public URL of uploaded video' },
        fileName: { type: 'string', description: 'Original file name' },
        type: { type: 'string', example: 'VIDEO' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type. Allowed types: mp4, mov.',
  })
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    const result = await this.attachmentService.uploadVideoSimple(file);

    return result;
  }
}

