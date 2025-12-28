import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Res,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import type { Response } from 'express';
import { AttachmentService } from '../services/attachment.service';

@ApiTags('Attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentService: AttachmentService) {}

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download attachment file',
    description: 'Download an attachment file. No authentication required. Returns binary file with correct Content-Type and Content-Disposition headers.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Attachment ID' })
  @ApiResponse({
    status: 200,
    description: 'File download successful',
    content: {
      'application/pdf': { schema: { type: 'string', format: 'binary' } },
      'image/jpeg': { schema: { type: 'string', format: 'binary' } },
      'image/png': { schema: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Attachment not found',
  })
  async downloadAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const fileData = await this.attachmentService.getFileDownloadStream(id);

    // Set headers
    res.setHeader('Content-Type', fileData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.fileName)}"`);
    res.setHeader('Content-Length', fileData.contentLength);

    // Convert S3 stream to buffer and send
    // AWS SDK v3 returns a Node.js Readable stream in Node.js environments
    const stream = fileData.stream as NodeJS.ReadableStream;
    const chunks: Buffer[] = [];
    
    for await (const chunk of stream as any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    
    const buffer = Buffer.concat(chunks);
    res.send(buffer);
  }
}

