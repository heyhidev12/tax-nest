/**
 * File type detection and validation utilities
 */

export enum DetectedFileType {
  IMAGE = 'IMAGE',
  PDF = 'PDF',
  VIDEO = 'VIDEO',
}

export interface FileTypeInfo {
  type: DetectedFileType;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

// Image configurations
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const IMAGE_MAX_SIZE = 20 * 1024 * 1024; // 20MB

// PDF and document configurations
const PDF_MIME_TYPES = [
  'application/pdf',
  'application/msword', // .doc
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
const PDF_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.vcf', '.vcard'];
const PDF_MAX_SIZE = 20 * 1024 * 1024; // 20MB

// Video configurations
const VIDEO_MIME_TYPES = ['video/mp4'];
const VIDEO_EXTENSIONS = ['.mp4'];
const VIDEO_MAX_SIZE = 30 * 1024 * 1024; // 30MB

export const FILE_TYPE_CONFIGS: Record<DetectedFileType, FileTypeInfo> = {
  [DetectedFileType.IMAGE]: {
    type: DetectedFileType.IMAGE,
    maxSizeBytes: IMAGE_MAX_SIZE,
    allowedMimeTypes: IMAGE_MIME_TYPES,
    allowedExtensions: IMAGE_EXTENSIONS,
  },
  [DetectedFileType.PDF]: {
    type: DetectedFileType.PDF,
    maxSizeBytes: PDF_MAX_SIZE,
    allowedMimeTypes: PDF_MIME_TYPES,
    allowedExtensions: PDF_EXTENSIONS,
  },
  [DetectedFileType.VIDEO]: {
    type: DetectedFileType.VIDEO,
    maxSizeBytes: VIDEO_MAX_SIZE,
    allowedMimeTypes: VIDEO_MIME_TYPES,
    allowedExtensions: VIDEO_EXTENSIONS,
  },
};

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
}

/**
 * Detect file type based on MIME type and extension
 * Returns null if file type cannot be determined or is not supported
 */
export function detectFileType(
  mimeType: string,
  filename: string,
): { type: DetectedFileType; config: FileTypeInfo } | null {
  const extension = getFileExtension(filename);

  // Check each file type
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIGS)) {
    const detectedType = type as DetectedFileType;
    
    // Check MIME type
    const mimeMatch = config.allowedMimeTypes.includes(mimeType);
    
    // Check extension
    const extMatch = config.allowedExtensions.includes(extension);
    
    // Both MIME type and extension must match
    if (mimeMatch && extMatch) {
      return { type: detectedType, config };
    }
  }

  return null;
}

/**
 * Validate file type and size
 * Returns validation result with error message if invalid
 */
export function validateFile(
  file: Express.Multer.File,
): { valid: boolean; error?: string; fileType?: DetectedFileType; config?: FileTypeInfo } {
  if (!file) {
    return { valid: false, error: '파일이 제공되지 않았습니다.' };
  }

  // Detect file type
  const detection = detectFileType(file.mimetype, file.originalname);
  if (!detection) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. 허용된 형식: 이미지(jpeg, png), 문서(pdf, doc, docx, xls, xlsx, ppt, pptx, zip, vcard), 비디오(mp4)`,
    };
  }

  // Validate file size
  if (file.size > detection.config.maxSizeBytes) {
    const maxSizeMB = detection.config.maxSizeBytes / (1024 * 1024);
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 크기: ${maxSizeMB}MB (현재: ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
    };
  }

  return {
    valid: true,
    fileType: detection.type,
    config: detection.config,
  };
}
