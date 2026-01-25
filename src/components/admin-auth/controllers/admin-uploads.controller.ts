import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
  @UseInterceptors(FilesInterceptor('file', 100, fileUploadConfig))
  @ApiOperation({
    summary: 'Upload single or multiple files (Images, PDF, Docs, ZIP, V-Card, Videos)',
    description: 'Upload one or multiple files to AWS S3. Supports images (jpeg, png) max 20MB, PDF/docs/zip/vcard max 20MB, videos (mp4) max 30MB. Validates both MIME type and file extension. Returns list of uploaded files with URLs and detected types. Supports both single file (field name: "file") and multiple files (field name: "file" as array).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload - supports both single file and multiple files using field name "file"',
    schema: {
      type: 'object',
      properties: {
        file: {
          oneOf: [
            {
              type: 'string',
              format: 'binary',
              description: 'Single file to upload (for backward compatibility)',
            },
            {
              type: 'array',
              items: {
                type: 'string',
                format: 'binary',
              },
              description: 'Multiple files to upload',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File(s) uploaded successfully. Returns array of uploaded files with attachment ID, URL, file name, and detected type (IMAGE, PDF, VIDEO). For single file upload (backward compatible), returns single object.',
    schema: {
      oneOf: [
        {
          type: 'object',
          description: 'Single file response (backward compatible)',
          properties: {
            id: { type: 'number', description: 'Attachment database ID' },
            url: { type: 'string', description: 'Public URL of uploaded file' },
            fileName: { type: 'string', description: 'Original file name' },
            type: { type: 'string', enum: ['IMAGE', 'PDF', 'VIDEO'], description: 'Detected file type' },
          },
        },
        {
          type: 'array',
          description: 'Multiple files response',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Attachment database ID' },
              url: { type: 'string', description: 'Public URL of uploaded file' },
              fileName: { type: 'string', description: 'Original file name' },
              type: { type: 'string', enum: ['IMAGE', 'PDF', 'VIDEO'], description: 'Detected file type' },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size limit exceeded. Allowed types: Images (jpeg, png) max 20MB, PDF/docs/zip/vcard max 20MB, Videos (mp4) max 30MB.',
  })
  async uploadFile(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // If single file, return single object for backward compatibility
    if (files.length === 1) {
      const result = await this.attachmentService.uploadFileSimple(files[0]);
      return result;
    }

    // Multiple files, return array
    const results = await this.attachmentService.uploadFilesSimple(files);
    return results;
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

