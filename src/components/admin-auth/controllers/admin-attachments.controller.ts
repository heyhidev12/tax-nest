import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminBaseController } from './admin-base.controller';
import { AttachmentService } from 'src/components/content/services/attachment.service';
import { fileUploadConfig } from 'src/libs/upload/config/attachment-upload.config';

@ApiTags('Admin Attachments')
@Controller('admin/attachments')
export class AdminAttachmentsController extends AdminBaseController {
  constructor(private readonly attachmentService: AttachmentService) {
    super();
  }

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', fileUploadConfig))
  @ApiOperation({
    summary: 'Upload file (PDF, Docs, Zip, etc.)',
    description: 'Upload a file (PDF, Word, Excel, PowerPoint, Zip, etc.) to AWS S3. No file size limit. Files accumulate (do not replace existing).',
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
    description: 'Invalid file type. Allowed types: pdf, msword, vnd.*, zip. No size limit.',
  })
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    const result = await this.attachmentService.uploadFileSimple(file);

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete attachment',
    description: 'Delete an attachment by ID. Deletes the file from S3 and removes the database record. Never delete using S3 key from client.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Attachment ID' })
  @ApiResponse({
    status: 200,
    description: 'Attachment deleted successfully from both S3 and database',
  })
  @ApiResponse({
    status: 404,
    description: 'Attachment not found',
  })
  async deleteAttachment(@Param('id', ParseIntPipe) id: number) {
    await this.attachmentService.deleteAttachment(id);
    return { success: true, message: 'Attachment deleted successfully' };
  }
}

