import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customerRoutes.js"; // ✅ .js added

dotenv.config();

const app = express();

// =======================
// Middleware
// =======================
app.use(cors({
  origin: "*", // abhi ke liye open (later frontend URL laga dena)
}));
app.use(express.json());

// =======================
// MongoDB Connection
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// =======================
// Routes
// =======================
app.use("/api/customers", customerRoutes);

// =======================
// Server
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Backend running on port ${PORT}`)
);
