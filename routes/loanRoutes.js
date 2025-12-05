import express from "express";
const router = express.Router();

// Placeholder — you can add full loan API later
router.get("/", (req, res) => {
  res.send("Loans API Working");
});

export default router;
