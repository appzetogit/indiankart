import multer from 'multer';

// Use in-memory storage; files will be sent to Cloudinary from buffers
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export default upload;

