import express from "express";
import {
  createLoan,
  getAllLoans,
  getLoanById,
  updateLoan,
  deleteLoanById,
  searchByIdNumber,
  getLoanStatistics,
  testCloudinary,
  createMultipleLoans
} from "../controllers/loanController.js";
import upload, { uploadToCloudinary } from "../middleware/upload.js";

const router = express.Router();

// Test route
router.get("/test/cloudinary", testCloudinary);

// CREATE LOAN with image upload
router.post("/", 
  upload.single("customerImage"), 
  uploadToCloudinary, 
  createLoan
);

// UPDATE LOAN with optional image upload
router.put("/:id", 
  upload.single("customerImage"), 
  uploadToCloudinary, 
  updateLoan
);

// GET all loans with pagination & filtering
router.get("/", getAllLoans);

// GET loan statistics
router.get("/stats", getLoanStatistics);

// GET single loan by ID
router.get("/:id", getLoanById);

// DELETE loan by ID
router.delete("/:id", deleteLoanById);

// SEARCH loan by ID number
router.get("/search/:idNumber", searchByIdNumber);

router.post("/bulk", createMultipleLoans);

export default router;