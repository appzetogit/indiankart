import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';

const uploadTempDir = path.join(os.tmpdir(), 'indiakart-uploads');
fs.mkdirSync(uploadTempDir, { recursive: true });

// Temp names never reuse the client's extension; the real type is decided
// from the file's content when (and if) it is published.
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadTempDir),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}-${crypto.randomUUID()}.upload`),
});

// Allow-list. A block-list always misses one: ".shtml" (served as HTML by
// nginx) got through the old one. This is only the first gate; published files
// are re-checked by content in utils/localStorage.js, and spreadsheets for the
// imports are read in place and never published.
const MEDIA_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.mp4', '.webm', '.mov']);
const SHEET_EXTENSIONS = new Set(['.xlsx', '.xls', '.csv']);

const isMedia = (ext, mime) => MEDIA_EXTENSIONS.has(ext) && (mime.startsWith('image/') || mime.startsWith('video/'));
const isSheet = (ext, mime) => SHEET_EXTENSIONS.has(ext) && !/html|javascript|xml\+|svg/.test(mime);

const makeFilter = ({ allowSheets }) => (_req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = String(file.mimetype || '').toLowerCase();
  if (isMedia(ext, mime) || (allowSheets && isSheet(ext, mime))) {
    return cb(null, true);
  }
  return cb(new Error(allowSheets
    ? 'Only images (JPG, PNG, WebP, GIF, AVIF), videos (MP4, WebM, MOV) or spreadsheets (XLSX, XLS, CSV) can be uploaded.'
    : 'Only images (JPG, PNG, WebP, GIF, AVIF) or videos (MP4, WebM, MOV) can be uploaded.'));
};

// Admin uploads: product media, banners, reels, spreadsheet imports.
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 300, fields: 500 },
  fileFilter: makeFilter({ allowSheets: true }),
});

// Customer return / replacement proof: small and few.
export const returnProofUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 6, fields: 40 },
  fileFilter: makeFilter({ allowSheets: false }),
});

export default upload;
