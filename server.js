import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import loanRoutes from "./routes/loanRoutes.js";

// Connect to database
connectDB();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log environment variables (for debugging)
console.log("=== Environment Variables Check ===");
console.log("Server Port:", process.env.PORT);
console.log("MongoDB Connected:", !!process.env.MONGO_URI);
console.log("Cloudinary Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);
console.log("Cloudinary API Secret Loaded:", !!process.env.CLOUDINARY_API_SECRET);
console.log("==================================");

// Routes
app.use("/api/loans", loanRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Loan Management API is running",
    timestamp: new Date().toISOString(),
    endpoints: {
      loans: "/api/loans",
      statistics: "/api/loans/stats",
      test: "/api/loans/test/cloudinary"
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("🚨 ERROR:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose Cast Error (Invalid ID)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📁 Upload folder: loan_customers`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
});