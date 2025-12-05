import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    address: String,
    joinDate: String,
    idType: String,
    idNumber: String,
    loanAmount: Number,
    interest: Number,
    term: Number,
    photo: String
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema);
