import { memoryStorage } from 'multer';

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

// Allowed image MIME types: jpg, png, webp
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Multer configuration for image uploads
 * - Uses memory storage (no files saved on disk)
 * - Validates file type (jpg, png, webp)
 * - Limits file size to 5MB
 */
export const imageUploadConfig = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file at a time
  },
  fileFilter: (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
    // Validate MIME type
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
        ),
        false,
      );
    }
  },
};
