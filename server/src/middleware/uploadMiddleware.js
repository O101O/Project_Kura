import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadsDir = path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadsDir, { recursive: true });

const sanitizeFileName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

const imageOnlyFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const attachmentFilter = (_req, file, cb) => {
  if (!file?.mimetype) {
    cb(new Error('Invalid file upload'));
    return;
  }

  cb(null, true);
};

const storage = multer.memoryStorage();
const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${sanitizeFileName(file.originalname)}`);
  }
});

export const upload = multer({
  storage,
  fileFilter: imageOnlyFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

export const messageUpload = multer({
  storage: attachmentStorage,
  fileFilter: attachmentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export const getUploadedFile = (req) => {
  if (req.file) {
    return req.file;
  }

  if (!req.files) {
    return null;
  }

  return req.files.file?.[0] || req.files.image?.[0] || null;
};

export { uploadsDir };
