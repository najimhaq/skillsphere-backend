// src/middlewares/upload-profile-image.ts
import multer from 'multer';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const uploadProfileImage = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Only JPEG, PNG, and WebP image files are allowed.'));
      return;
    }

    callback(null, true);
  },
});
