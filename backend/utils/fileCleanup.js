import { promises as fs } from 'node:fs';

const collectFiles = (value, target) => {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectFiles(item, target));
    return;
  }

  if (typeof value === 'object') {
    if (typeof value.path === 'string' && value.path) {
      target.push(value.path);
      return;
    }

    Object.values(value).forEach((item) => collectFiles(item, target));
  }
};

export const cleanupUploadedFiles = async (...values) => {
  const filePaths = [];
  values.forEach((value) => collectFiles(value, filePaths));

  if (filePaths.length === 0) return;

  await Promise.allSettled(
    [...new Set(filePaths)].map((filePath) => fs.unlink(filePath))
  );
};
