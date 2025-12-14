import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  phone: String,
  address: String,
  joinDate: String,
  idType: String,
  idNumber: String,
  loanAmount: String,
  interest: String,
  term: String,
  photo: String,
});

const Customer = mongoose.model("Customer", CustomerSchema);

export default Customer;
