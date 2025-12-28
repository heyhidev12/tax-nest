import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

// Allowed image types: jpeg, png, webp
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const imageUploadConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {},
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: jpeg, png, webp`), false);
    }
  },
};

