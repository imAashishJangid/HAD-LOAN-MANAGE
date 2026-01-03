import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: [true, "Name is required"],
      trim: true
    },
    phone: { 
      type: String, 
      required: [true, "Phone number is required"],
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    joinDate: {
      type: Date,
      default: Date.now
    },

    idType: {
      type: String,
      enum: ["Aadhaar", "PAN", "Voter ID", "Driving License", "Passport"],
      trim: true
    },
    idNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true // Allows null/undefined for uniqueness
    },

    customerImage: {
      url: String,
      public_id: String,
    },

    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [0, "Loan amount cannot be negative"]
    },
    interestRate: {
      type: Number,
      required: [true, "Interest rate is required"],
      min: [0, "Interest rate cannot be negative"]
    },
    term: {
      type: String,
      enum: ["months", "years"],
      default: "months"
    },
    months: {
      type: Number,
      min: [1, "Months must be at least 1"]
    },
    years: {
      type: Number,
      min: [1, "Years must be at least 1"]
    },

    totalPayable: {
      type: Number,
      min: [0, "Total payable cannot be negative"]
    },
    monthlyInstallment: {
      type: Number,
      min: [0, "Monthly installment cannot be negative"]
    },

    status: {
      type: String,
      enum: ["active", "closed", "defaulted", "pending"],
      default: "active"
    },

    totalLoans: {
      type: Number,
      default: 1,
      min: [1, "Total loans must be at least 1"]
    },
    
    notes: {
      type: String,
      trim: true
    },
    
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User" // If you have user authentication
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for term in months
loanSchema.virtual('termInMonths').get(function() {
  if (this.term === 'years' && this.years) {
    return this.years * 12;
  }
  return this.months || 0;
});

// Calculate total payable before saving
loanSchema.pre('save', function(next) {
  if (this.loanAmount && this.interestRate) {
    const principal = this.loanAmount;
    const rate = this.interestRate / 100;
    
    if (this.term === 'months' && this.months) {
      const months = this.months;
      // Simple interest calculation
      const interest = principal * rate * (months / 12);
      this.totalPayable = principal + interest;
      this.monthlyInstallment = this.totalPayable / months;
    } else if (this.term === 'years' && this.years) {
      const years = this.years;
      const interest = principal * rate * years;
      this.totalPayable = principal + interest;
      this.monthlyInstallment = this.totalPayable / (years * 12);
    }
  }
  next();
});

// Indexes for better performance
loanSchema.index({ idNumber: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });
loanSchema.index({ name: 'text', phone: 'text', idNumber: 'text' });

const Loan = mongoose.model("Loan", loanSchema);

export default Loan;