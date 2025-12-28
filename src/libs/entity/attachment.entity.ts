import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { AttachmentFileType } from '../enums/attachment.enum';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AttachmentFileType })
  fileType: AttachmentFileType;

  @Column()
  s3Key: string;

  @Column()
  mimeType: string;

  @Column({ type: 'bigint' })
  size: number;

  @Column()
  originalName: string;

  @CreateDateColumn()
  createdAt: Date;

  // Legacy fields for backward compatibility (deprecated)
  // These are kept for data migration purposes but should not be used in new code
  @Column({ nullable: true, type: 'int' })
  articleId: number | null;

  @Column({ nullable: true, type: 'text' })
  fileUrl: string | null;

  @Column({ nullable: true, type: 'varchar', length: 255 })
  fileName: string | null;

  @Column({ nullable: true, type: 'bigint' })
  fileSize: number | null;
}

