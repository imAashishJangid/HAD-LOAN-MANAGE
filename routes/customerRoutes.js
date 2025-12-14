import express from "express";
import Customer from "../models/Customer.js";

const router = express.Router();

// =======================
// GET all customers
// =======================
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch customers" });
  }
});

// =======================
// POST new customer
// =======================
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();

    res.status(201).json({
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message || "Failed to create customer",
    });
  }
});

export default router;
