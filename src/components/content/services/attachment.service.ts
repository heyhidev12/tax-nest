import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from 'src/libs/entity/attachment.entity';
import { AttachmentFileType } from 'src/libs/enums/attachment.enum';
import { UploadService } from 'src/libs/upload/upload.service';


@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Upload image and create attachment record
   */
  async uploadImageSimple(file: Express.Multer.File): Promise<{
    id: number;
    url: string;
    fileName: string;
    type: string;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Upload to S3
    const { url, key } = await this.uploadService.uploadImage(file);

    // Create attachment record (no targetType/targetId needed)
    const attachment = this.attachmentRepo.create({
      fileType: AttachmentFileType.IMAGE,
      s3Key: key,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    });

    const saved = await this.attachmentRepo.save(attachment);

    return {
      id: saved.id,
      url,
      fileName: file.originalname,
      type: 'IMAGE',
    };
  }

  /**
   * Upload video and create attachment record
   */
  async uploadVideoSimple(file: Express.Multer.File): Promise<{
    id: number;
    url: string;
    fileName: string;
    type: string;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Upload to S3
    const { url, key } = await this.uploadService.uploadVideo(file);

    // Create attachment record (no targetType/targetId needed)
    const attachment = this.attachmentRepo.create({
      fileType: AttachmentFileType.VIDEO,
      s3Key: key,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    });

    const saved = await this.attachmentRepo.save(attachment);

    return {
      id: saved.id,
      url,
      fileName: file.originalname,
      type: 'VIDEO',
    };
  }

  /**
   * Upload file and create attachment record
   */
  async uploadFileSimple(file: Express.Multer.File): Promise<{
    id: number;
    url: string;
    fileName: string;
    type: string;
  }> {
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Upload to S3
    const { url, key } = await this.uploadService.uploadFile(file);

    // Create attachment record (no targetType/targetId needed)
    const attachment = this.attachmentRepo.create({
      fileType: AttachmentFileType.FILE,
      s3Key: key,
      mimeType: file.mimetype,
      size: file.size,
      originalName: file.originalname,
    });

    const saved = await this.attachmentRepo.save(attachment);

    return {
      id: saved.id,
      url,
      fileName: file.originalname,
      type: 'FILE',
    };
  }





  /**
   * Delete attachment by ID (deletes from both S3 and DB)
   */
  async deleteAttachment(id: number): Promise<void> {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }

    // Get S3 key from DB
    const s3Key = attachment.s3Key;

    // Delete file from S3
    await this.uploadService.deleteFile(s3Key);

    // Delete DB record
    await this.attachmentRepo.remove(attachment);
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(id: number): Promise<Attachment> {
    const attachment = await this.attachmentRepo.findOne({ where: { id } });
    if (!attachment) {
      throw new NotFoundException('첨부파일을 찾을 수 없습니다.');
    }
    return attachment;
  }


  /**
   * Get file download stream
   */
  async getFileDownloadStream(attachmentId: number) {
    const attachment = await this.getAttachmentById(attachmentId);
    
    const fileData = await this.uploadService.downloadFile(attachment.s3Key);
    
    return {
      stream: fileData.body,
      contentType: attachment.mimeType || fileData.contentType,
      fileName: attachment.originalName,
      contentLength: attachment.size || fileData.contentLength,
    };
  }

  /**
   * Format attachment for response
   */
  formatAttachmentResponse(attachment: Attachment) {
    return {
      id: attachment.id,
      type: attachment.fileType,
      fileName: attachment.originalName,
      mimeType: attachment.mimeType,
      size: attachment.size,
      s3Key: attachment.s3Key,
      url: `https://${process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET}.s3.${process.env.AWS_S3_REGION || process.env.AWS_REGION}.amazonaws.com/${attachment.s3Key}`,
      createdAt: attachment.createdAt,
    };
  }
}
