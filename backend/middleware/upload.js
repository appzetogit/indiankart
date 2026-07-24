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
    const ext = path.extname(file.originalname || '').slice(0, 16);
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  }
});

// Blocklist rather than allowlist: this middleware also carries the .xlsx stock
// import and reel videos. SVG/HTML get served back by the CDN as active content,
// which is stored XSS on our own origin.
const BLOCKED_UPLOAD_EXTENSIONS = new Set(['.svg', '.svgz', '.html', '.htm', '.xhtml', '.xml', '.js', '.mjs', '.swf']);
const BLOCKED_UPLOAD_MIMES = new Set(['image/svg+xml', 'text/html', 'application/xhtml+xml', 'text/javascript', 'application/javascript']);

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const mime = String(file.mimetype || '').toLowerCase();
    if (BLOCKED_UPLOAD_EXTENSIONS.has(ext) || BLOCKED_UPLOAD_MIMES.has(mime)) {
      return cb(new Error('This file type is not allowed.'));
    }
    return cb(null, true);
  },
});

export default upload;

