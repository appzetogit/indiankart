import { promises as fs } from 'node:fs';
import cloudinary from '../config/cloudinary.js';

export const uploadBufferToCloudinary = (input, options = {}) =>
  new Promise((resolve, reject) => {
    if (input?.path) {
      cloudinary.uploader.upload(
        input.path,
        { folder: 'ecom_uploads', resource_type: 'auto', ...options },
        async (error, result) => {
          await fs.unlink(input.path).catch(() => {});
          if (error) return reject(error);
          return resolve(result);
        }
      );
      return;
    }

    const buffer = Buffer.isBuffer(input) ? input : input?.buffer;
    if (!buffer) {
      reject(new Error('Upload input must include a file path or buffer'));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ecom_uploads', resource_type: 'auto', ...options },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(buffer);
  });

