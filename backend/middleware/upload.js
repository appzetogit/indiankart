import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

const uploadTempDir = path.join(os.tmpdir(), 'indiakart-uploads');
fs.mkdirSync(uploadTempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadTempDir),
  filename: (_req, file, cb) => {
    const safeExtension = path.extname(file.originalname || '').slice(0, 16);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${safeExtension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 80,
    parts: 120
  }
});

export default upload;

