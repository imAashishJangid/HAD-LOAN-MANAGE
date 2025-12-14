import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customerRoutes.js";

dotenv.config();
const app = express();

// ===== CORS Middleware (yehi code lagao) =====
const allowedOrigins = [
  "https://had-finance-crm.onrender.com", // live frontend
  "http://localhost:5173",                // dev server
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// ===== JSON Parsing =====
app.use(express.json());

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ===== Routes =====
app.use("/api/customers", customerRoutes);

// ===== Start Server =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
