import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
import multerStorageCloudinary from 'multer-storage-cloudinary';

dotenv.config();

// For CommonJS-based packages like `multer-storage-cloudinary`,
// we need to pull named exports off the default import in ESM.
const { CloudinaryStorage } = multerStorageCloudinary;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecom_uploads',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'mp4', 'mov'], // Added video formats for reels if needed
    resource_type: 'auto',
  },
});

const upload = multer({ storage: storage });

export default upload;
