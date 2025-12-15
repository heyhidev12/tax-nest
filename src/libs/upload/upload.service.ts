import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadService {
  private readonly s3: S3Client | null;
  private readonly bucketName: string;
  private readonly region: string;

  // Allowed image types: jpg, png, webp
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  // Allowed video types: mp4, mov
  private readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
  
  // Max file size: 5MB
  private readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  constructor() {
    this.region = process.env.AWS_REGION as string;
    this.bucketName = process.env.AWS_BUCKET as string;

    const accessKeyId = process.env.AWS_ACCESS_KEY as string;
    const secretAccessKey = process.env.AWS_SECRET_KEY as string;

    if (!this.region || !this.bucketName || !accessKeyId || !secretAccessKey) {
      console.warn(
        '⚠️  AWS S3 credentials not fully configured. Upload features will not work until AWS_REGION, AWS_BUCKET, AWS_ACCESS_KEY, and AWS_SECRET_KEY are set.',
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
   * Validates file type (jpg, png, webp) and size (max 5MB)
   */
  async uploadImage(file: Express.Multer.File): Promise<{ url: string; key: string }> {
    // Validate AWS configuration
    if (!this.s3 || !this.region || !this.bucketName) {
      throw new BadRequestException('AWS S3 is not properly configured. Please check your environment variables.');
    }

    // Validate file exists
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image type: ${file.mimetype}. Allowed types: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.MAX_IMAGE_SIZE) {
      throw new BadRequestException(`File size exceeds maximum allowed size of ${this.MAX_IMAGE_SIZE / 1024 / 1024}MB`);
    }

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/images/${timestamp}-${sanitizedFileName}`;

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
   * Generate presigned URL for video upload
   * Client will use this URL to upload video directly to S3
   * URL expires in 5 minutes
   */
  async generateVideoPresignedUrl(fileName: string, contentType: string): Promise<{
    presignedUrl: string;
    url: string;
    key: string;
    expiresIn: number;
  }> {
    // Validate AWS configuration
    if (!this.s3 || !this.region || !this.bucketName) {
      throw new BadRequestException('AWS S3 is not properly configured. Please check your environment variables.');
    }

    // Validate file name
    if (!fileName || fileName.trim().length === 0) {
      throw new BadRequestException('File name is required');
    }

    // Validate content type
    if (!this.ALLOWED_VIDEO_TYPES.includes(contentType)) {
      throw new BadRequestException(
        `Invalid video type: ${contentType}. Allowed types: ${this.ALLOWED_VIDEO_TYPES.join(', ')}`,
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `uploads/videos/${timestamp}-${sanitizedFileName}`;

    // Create PutObject command
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    });

    // Generate presigned URL (expires in 5 minutes = 300 seconds)
    const expiresIn = 300; // 5 minutes
    const presignedUrl = await getSignedUrl(this.s3, command, { expiresIn });

    // Return the URL that will be accessible after upload (for reference)
    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      presignedUrl,
      url,
      key,
      expiresIn,
    };
  }
}
