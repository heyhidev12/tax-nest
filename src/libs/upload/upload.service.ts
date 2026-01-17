import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class UploadService {
  private readonly s3: S3Client | null;
  private readonly bucketName: string;
  private readonly region: string;

  // Allowed image types: jpeg, png, webp
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  
  // Allowed video types: mp4, mov
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
  
  // Allowed file types: pdf, msword, vnd.*, zip
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
  'text/plain'
  ];
  
  // File size limits removed - no size restrictions

  constructor() {
    // Support both old and new env var names for backward compatibility
    this.region = (process.env.AWS_S3_REGION || process.env.AWS_REGION) as string;
    this.bucketName = (process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET) as string;

    const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY) as string;
    const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY) as string;

    if (!this.region || !this.bucketName || !accessKeyId || !secretAccessKey) {
      console.warn(
        '⚠️  AWS S3 credentials not fully configured. Upload features will not work until AWS_S3_REGION (or AWS_REGION), AWS_S3_BUCKET (or AWS_BUCKET), AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY), and AWS_SECRET_ACCESS_KEY (or AWS_SECRET_KEY) are set.',
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
    const key = `admin/uploads/images/${timestamp}-${sanitizedFileName}`;

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
    const key = `admin/uploads/videos/${timestamp}-${sanitizedFileName}`;

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
   * Upload file to S3 (PDF, Docs, Zip, etc.)
   * Validates file type - no size limit
   * Key structure: admin/uploads/files/timestamp-filename
   */
  async uploadFile(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    // Validate AWS configuration
    if (!this.s3 || !this.region || !this.bucketName) {
      throw new BadRequestException('AWS S3가 올바르게 설정되지 않았습니다. 환경 변수를 확인해주세요.');
    }

    // Validate file exists
    if (!file) {
      throw new BadRequestException('파일이 제공되지 않았습니다.');
    }

    // // Validate file type
    // if (!this.ALLOWED_FILE_TYPES.includes(file.mimetype) &&
    //     !file.mimetype.startsWith('application/vnd.')) {
    //   throw new BadRequestException(
    //     `Invalid file type: ${file.mimetype}. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}, application/vnd.*`,
    //   );
    // }
    if (
      !this.ALLOWED_FILE_TYPES.includes(file.mimetype) &&
      !file.mimetype.startsWith('application/vnd.')
    ) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
    

    // No file size validation - unlimited size allowed

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `admin/uploads/files/${timestamp}-${sanitizedFileName}`;

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
