import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

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
