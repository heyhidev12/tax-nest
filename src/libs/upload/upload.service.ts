import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly s3: S3Client | null;
  private readonly bucketName: string;
  private readonly region: string;

  // Allowed image types: jpeg, png
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
  private readonly ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
  
  // Allowed video types: mp4
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4'];
  private readonly ALLOWED_VIDEO_EXTENSIONS = ['.mp4'];
  
  // Allowed file types: pdf, docs, zip, xsl, ppt, vcard
  private readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/zip',
    'application/x-zip-compressed',
    'application/vcard',
    'text/vcard',
    'text/x-vcard',
  ];
  private readonly ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.vcf', '.vcard'];
  
  // File size limits (in bytes)
  private readonly MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB
  private readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  private readonly MAX_VIDEO_SIZE = 30 * 1024 * 1024; // 30MB

  constructor() {
    // Support both old and new env var names for backward compatibility
    this.region = (process.env.AWS_REGION) as string;
    this.bucketName = (process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET) as string;

    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY) as string;
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY) as string;

    if (!this.region || !this.bucketName || !accessKeyId || !secretAccessKey) {
      console.warn(
        '⚠️  AWS S3 credentials not fully configured. Upload features will not work until AWS_REGION, AWS_S3_BUCKET (or AWS_BUCKET), AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY), and AWS_SECRET_ACCESS_KEY (or AWS_SECRET_KEY) are set.',
      );
      // Don't throw error, but S3 operations will fail with a more descriptive error
      this.s3 = null;
      return;
    }

    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  /**
   * Upload image to S3
   * Validates file type (jpeg, png, webp) - no size limit
   * Key structure: admin/uploads/images/timestamp-filename
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    // Validate AWS configuration
    if (!this.s3 || !this.region || !this.bucketName) {
      throw new BadRequestException('AWS S3가 올바르게 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }

    // Validate file exists
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Validate file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type: ${file.mimetype}. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // No file size validation - unlimited size allowed

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const basePath = process.env.S3_BASE_PATH || '';

const key = basePath
  ? `${basePath}/admin/uploads/images/${timestamp}-${sanitizedFileName}`
  : `admin/uploads/images/${timestamp}-${sanitizedFileName}`;

    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
      }),
    );

    // Return public URL (if bucket is configured for public access)
    // For private buckets, you'll need to generate presigned URLs for access
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key };
  }

  /**
   * Upload video to S3
   * Validates file type (mp4, mov) - no size limit
   * Key structure: admin/uploads/videos/timestamp-filename
   */
  async uploadVideo(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    // Validate AWS configuration
    if (!this.s3 || !this.region || !this.bucketName) {
      throw new BadRequestException('AWS S3가 올바르게 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }

    // Validate file exists
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Validate file type
    if (!this.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `유효하지 않은 비디오 형식입니다: ${file.mimetype}. 허용된 형식: ${this.ALLOWED_VIDEO_TYPES.join(', ')}`,
      );
    }

    // No file size validation - unlimited size allowed

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const basePath = process.env.S3_BASE_PATH || '';

const key = basePath
  ? `${basePath}/admin/uploads/videos/${timestamp}-${sanitizedFileName}`
  : `admin/uploads/videos/${timestamp}-${sanitizedFileName}`;

    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
      }),
    );

    // Return public URL (if bucket is configured for public access)
    // For private buckets, you'll need to generate presigned URLs for access
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key };
  }

  /**
   * Detect file type based on MIME type and extension
   * Returns 'IMAGE', 'PDF', or 'VIDEO'
   */
  detectFileType(file: Express.Multer.File): 'IMAGE' | 'PDF' | 'VIDEO' {
    const fileName = file.originalname.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const mimeType = file.mimetype.toLowerCase();

    // Check for images
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType) && this.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
      return 'IMAGE';
    }

    // Check for videos
    if (this.ALLOWED_VIDEO_TYPES.includes(mimeType) && this.ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
      return 'VIDEO';
    }

    // Check for PDF/DOC/ZIP/etc files
    if (
      (this.ALLOWED_FILE_TYPES.includes(mimeType) || mimeType.startsWith('application/vnd.')) &&
      (this.ALLOWED_FILE_EXTENSIONS.includes(ext) || ext === '.vcf' || ext === '.vcard')
    ) {
      return 'PDF';
    }

    return 'PDF'; // Default fallback
  }

  /**
   * Validate file size based on file type
   */
  validateFileSize(file: Express.Multer.File, fileType: 'IMAGE' | 'PDF' | 'VIDEO'): void {
    let maxSize: number;
    let typeLabel: string;

    switch (fileType) {
      case 'IMAGE':
        maxSize = this.MAX_IMAGE_SIZE;
        typeLabel = '이미지';
        break;
      case 'PDF':
        maxSize = this.MAX_FILE_SIZE;
        typeLabel = '파일';
        break;
      case 'VIDEO':
        maxSize = this.MAX_VIDEO_SIZE;
        typeLabel = '비디오';
        break;
      default:
        maxSize = this.MAX_FILE_SIZE;
        typeLabel = '파일';
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `${typeLabel} 파일 크기가 제한을 초과했습니다. 최대 크기: ${maxSizeMB}MB, 현재 파일 크기: ${fileSizeMB}MB`,
      );
    }
  }

  /**
   * Validate file type (both MIME type and extension)
   */
  validateFileType(file: Express.Multer.File): { isValid: boolean; fileType: 'IMAGE' | 'PDF' | 'VIDEO'; error?: string } {
    const fileName = file.originalname.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const mimeType = file.mimetype.toLowerCase();

    // Check for images
    if (this.ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      if (!this.ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        return {
          isValid: false,
          fileType: 'IMAGE',
          error: `이미지 파일 확장자가 일치하지 않습니다. MIME 타입: ${file.mimetype}, 확장자: ${ext}. 허용된 확장자: ${this.ALLOWED_IMAGE_EXTENSIONS.join(', ')}`,
        };
      }
      return { isValid: true, fileType: 'IMAGE' };
    }

    // Check for videos
    if (this.ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      if (!this.ALLOWED_VIDEO_EXTENSIONS.includes(ext)) {
        return {
          isValid: false,
          fileType: 'VIDEO',
          error: `비디오 파일 확장자가 일치하지 않습니다. MIME 타입: ${file.mimetype}, 확장자: ${ext}. 허용된 확장자: ${this.ALLOWED_VIDEO_EXTENSIONS.join(', ')}`,
        };
      }
      return { isValid: true, fileType: 'VIDEO' };
    }

    // Check for PDF/DOC/ZIP/etc files
    if (this.ALLOWED_FILE_TYPES.includes(mimeType) || mimeType.startsWith('application/vnd.')) {
      // For vnd.* types, we're more lenient with extensions, but still check common ones
      if (!mimeType.startsWith('application/vnd.') && !this.ALLOWED_FILE_EXTENSIONS.includes(ext)) {
        return {
          isValid: false,
          fileType: 'PDF',
          error: `파일 확장자가 일치하지 않습니다. MIME 타입: ${file.mimetype}, 확장자: ${ext}. 허용된 확장자: ${this.ALLOWED_FILE_EXTENSIONS.join(', ')}`,
        };
      }
      return { isValid: true, fileType: 'PDF' };
    }

    return {
      isValid: false,
      fileType: 'PDF',
      error: `허용되지 않은 파일 타입입니다. MIME 타입: ${file.mimetype}, 확장자: ${ext}`,
    };
  }

  /**
   * Upload file to S3 (PDF, Docs, Zip, Images, Videos)
   * Validates file type and size based on detected type
   * Key structure: admin/uploads/files/timestamp-filename or admin/uploads/images/timestamp-filename or admin/uploads/videos/timestamp-filename
   */
  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string; fileType: 'IMAGE' | 'PDF' | 'VIDEO' }> {
    // Validate AWS configuration
    if (!this.s3 || !this.region || !this.bucketName) {
      throw new BadRequestException('AWS S3가 올바르게 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }

    // Validate file exists
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // Validate file type (MIME and extension) - this also returns the detected type
    const typeValidation = this.validateFileType(file);
    if (!typeValidation.isValid) {
      throw new BadRequestException(typeValidation.error);
    }

    const fileType = typeValidation.fileType;

    // Validate file size based on type
    this.validateFileSize(file, fileType);

    // Generate unique key based on file type
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const basePath = process.env.S3_BASE_PATH || '';

    let key: string;
    if (fileType === 'IMAGE') {
      key = basePath
        ? `${basePath}/admin/uploads/images/${timestamp}-${sanitizedFileName}`
        : `admin/uploads/images/${timestamp}-${sanitizedFileName}`;
    } else if (fileType === 'VIDEO') {
      key = basePath
        ? `${basePath}/admin/uploads/videos/${timestamp}-${sanitizedFileName}`
        : `admin/uploads/videos/${timestamp}-${sanitizedFileName}`;
    } else {
      key = basePath
        ? `${basePath}/admin/uploads/files/${timestamp}-${sanitizedFileName}`
        : `admin/uploads/files/${timestamp}-${sanitizedFileName}`;
    }

    // Upload to S3
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
      }),
    );

    // Return public URL (if bucket is configured for public access)
    // For private buckets, you'll need to generate presigned URLs for access
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return { url, key, fileType };
  }

  /**
   * Extract S3 key from URL for cleanup operations
   */
  extractS3KeyFromUrl(url: string): string | null {
    if (!url) return null;

    try {
      const urlObj = new URL(url);
      // Remove the leading '/' from pathname
      return urlObj.pathname.substring(1);
    } catch {
      // If URL parsing fails, try to extract key from common patterns
      const match = url.match(/amazonaws\.com\/(.+)$/);
      return match ? match[1] : null;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3 || !this.bucketName) {
      throw new BadRequestException('AWS S3가 올바르게 설정되지 않았습니다.');
    }
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
    } catch (error: any) {
      // Log error but don't throw if file not found, as it might already be deleted
      if (error.name !== 'NoSuchKey') {
        console.error(`Failed to delete file from S3: ${key}, Error: ${error.message}`);
      }
    }
  }

  /**
   * Delete file from S3 by URL
   * Used for cleanup when entities are deleted or URLs are replaced
   */
  async deleteFileByUrl(url: string): Promise<void> {
    const key = this.extractS3KeyFromUrl(url);
    if (key) {
      await this.deleteFile(key);
    }
  }

  /**
   * Download file from S3
   */
  async downloadFile(key: string): Promise<{ body: any; contentType: string; contentLength: number }> {
    if (!this.s3 || !this.bucketName) {
      throw new BadRequestException('AWS S3가 올바르게 설정되지 않았습니다.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3.send(command);

    return {
      body: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
      contentLength: response.ContentLength || 0,
    };
  }

}
