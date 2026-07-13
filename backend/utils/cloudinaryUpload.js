import { createReadStream } from 'node:fs';
import cloudinary from '../config/cloudinary.js';

const DEFAULT_UPLOAD_OPTIONS = {
  folder: 'ecom_uploads',
  resource_type: 'auto'
};

export const uploadBufferToCloudinary = (input, options = {}) =>
  new Promise((resolve, reject) => {
    const uploadOptions = { ...DEFAULT_UPLOAD_OPTIONS, ...options };

    if (input?.path) {
      return cloudinary.uploader.upload(input.path, uploadOptions)
        .then(resolve)
        .catch(reject);
    }

    const buffer = Buffer.isBuffer(input) ? input : input?.buffer;
    if (!buffer) {
      return reject(new Error('Upload input must provide a file path or buffer'));
    }

    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(buffer);
  });

export const uploadFilePathToCloudinary = (filePath, options = {}) =>
  new Promise((resolve, reject) => {
    if (!filePath) {
      return reject(new Error('File path is required for Cloudinary upload'));
    }

    const uploadOptions = { ...DEFAULT_UPLOAD_OPTIONS, ...options };
    const stream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    createReadStream(filePath)
      .on('error', reject)
      .pipe(stream);
  });

