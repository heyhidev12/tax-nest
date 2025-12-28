import { ApiProperty } from '@nestjs/swagger';

export class AttachmentDto {
  @ApiProperty({ example: 1, description: 'Attachment ID' })
  id: number;

  @ApiProperty({ example: 'document.pdf', description: 'File name' })
  fileName: string;

  @ApiProperty({ example: 'https://bucket.s3.region.amazonaws.com/uploads/attachments/123-document.pdf', description: 'File URL' })
  fileUrl: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  fileSize: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation date' })
  createdAt: Date;
}

export class AttachmentUploadResponseDto {
  @ApiProperty({ example: 1, description: 'Attachment ID' })
  id: number;

  @ApiProperty({ example: 'https://bucket.s3.region.amazonaws.com/uploads/attachments/123-document.pdf', description: 'File URL' })
  fileUrl: string;

  @ApiProperty({ example: 'document.pdf', description: 'File name' })
  fileName: string;

  @ApiProperty({ example: 'application/pdf', description: 'MIME type' })
  mimeType: string;

  @ApiProperty({ example: 1024000, description: 'File size in bytes' })
  fileSize: number;
}

