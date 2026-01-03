import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Memory storage for multer
const memoryStorage = multer.memoryStorage();

// Configure multer
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Middleware to upload to Cloudinary
export const uploadToCloudinary = (req, res, next) => {
  // If no file, move to next middleware
  if (!req.file) {
    return next();
  }

  console.log("Uploading file to Cloudinary:", req.file.originalname);
  
  // Create a unique public_id
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const publicId = `loan_${timestamp}_${randomString}`;
  
  // Upload stream to Cloudinary
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "loan_customers",
      public_id: publicId,
      resource_type: "image",
      transformation: [
        { width: 800, height: 800, crop: "limit", quality: "auto" }
      ]
    },
    (error, result) => {
      if (error) {
        console.error("Cloudinary Upload Error:", error);
        return next(error);
      }
      
      console.log("Cloudinary Upload Success:", result.public_id);
      
      // Attach Cloudinary result to request
      req.file.cloudinaryResult = result;
      next();
    }
  );
  
  // Pipe the buffer to Cloudinary
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
};

export default upload;