import cloudinary from '../config/cloudinary.js';

export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'ecom_uploads', resource_type: 'auto', ...options },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );

    stream.end(buffer);
  });

