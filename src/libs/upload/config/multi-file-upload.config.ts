// import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
// import { memoryStorage } from 'multer';
// import { FILE_TYPE_CONFIGS } from '../utils/file-type-detector';

// // Combine all allowed MIME types from all file type configs
// const ALL_ALLOWED_MIME_TYPES = [
//   ...FILE_TYPE_CONFIGS.IMAGE.allowedMimeTypes,
//   ...FILE_TYPE_CONFIGS.PDF.allowedMimeTypes,
//   ...FILE_TYPE_CONFIGS.VIDEO.allowedMimeTypes,
// ];

// export const multiFileUploadConfig: MulterOptions = {
//   storage: memoryStorage(),
//   limits: {
//     // Set a reasonable max file size limit (30MB for videos)
//     fileSize: 30 * 1024 * 1024,
//   },
//   fileFilter: (req, file, cb) => {
//     // Basic MIME type check - detailed validation will be done in the service
//     // This allows all potentially valid types, actual validation happens later
//     const isAllowed = ALL_ALLOWED_MIME_TYPES.includes(file.mimetype) ||
//                      file.mimetype.startsWith('application/vnd.');
    
//     if (isAllowed) {
//       cb(null, true);
//     } else {
//       cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: images (jpeg, png), documents (pdf, doc, docx, xls, xlsx, ppt, pptx, zip, vcard), videos (mp4)`), false);
//     }
//   },
// };
