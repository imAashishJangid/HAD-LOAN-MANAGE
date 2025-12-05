import express from "express";
import Customer from "../models/Customer.js";
const router = express.Router();

// CREATE CUSTOMER
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL CUSTOMERS
router.get("/", async (req, res) => {
  const data = await Customer.find();
  res.json(data);
});

export default router;
