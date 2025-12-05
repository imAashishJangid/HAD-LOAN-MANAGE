import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  amount: Number,
  interest: Number,
  term: Number,
  emi: Number,
  status: { type: String, default: "active" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Loan", loanSchema);
