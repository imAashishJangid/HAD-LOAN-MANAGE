import express from "express";
import Loan from "../models/Loan.js";

const router = express.Router();

// Create Loan
router.post("/", async (req, res) => {
  try {
    const loan = new Loan(req.body);
    const savedLoan = await loan.save();
    res.json(savedLoan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Loans
router.get("/", async (req, res) => {
  try {
    const loans = await Loan.find().populate("customerId");
    res.json(loans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
