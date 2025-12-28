import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

// Allowed file types: pdf, msword, vnd.*, zip
const ALLOWED_MIME_TYPES = [
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
    'text/plain'
];

export const fileUploadConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {},
  fileFilter: (req, file, cb) => {
    // Check if it's in the allowed list or starts with application/vnd.
    const isAllowed = ALLOWED_MIME_TYPES.includes(file.mimetype) || 
                     file.mimetype.startsWith('application/vnd.');
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: pdf, msword, vnd.*, zip`), false);
    }
  },
};

