import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

// Allowed video types: mp4, mov
const ALLOWED_MIME_TYPES = ['video/mp4', 'video/quicktime'];

export const videoUploadConfig: MulterOptions = {
  storage: memoryStorage(),
  limits: {},
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: mp4, mov`), false);
    }
  },
};

