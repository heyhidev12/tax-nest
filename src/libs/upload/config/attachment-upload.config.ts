import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

// Allowed file types: images (jpeg, png), PDF/docs/zip/vcard, videos (mp4)
// Note: Detailed validation with extensions happens in UploadService
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  // PDF and documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'application/x-zip-compressed',
  // V-Card formats
  'application/vcard',
  'text/vcard',
  'text/x-vcard',
  // Videos
  'video/mp4',
];

export const fileUploadConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {},
  fileFilter: (req, file, cb) => {
    // Basic MIME type check - detailed validation with extensions happens in UploadService
    const isAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype) || 
                     file.mimetype.startsWith('application/vnd.');
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: images (jpeg, png), PDF/docs/zip/vcard, videos (mp4)`), false);
    }
  },
};

