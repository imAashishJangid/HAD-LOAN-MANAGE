import Loan from "../models/Loan.js";
import cloudinary from "../config/cloudinary.js";

export const createLoan = async (req, res, next) => {
  try {
    let customerImage = null;
    
    // Handle image from Cloudinary upload
    if (req.file && req.file.cloudinaryResult) {
      customerImage = {
        url: req.file.cloudinaryResult.secure_url,
        public_id: req.file.cloudinaryResult.public_id,
      };
    }

    // Create loan document
    const loan = await Loan.create({
      ...req.body,
      customerImage,
    });

    console.log("Loan created successfully:", loan._id);

    res.status(201).json({
      success: true,
      message: "Loan created successfully",
      data: loan,
    });
  } catch (error) {
    console.error("Create Loan Error:", error);
    
    // Handle duplicate ID number
    if (error.code === 11000 && error.keyPattern?.idNumber) {
      return res.status(400).json({
        success: false,
        message: "ID number already exists",
      });
    }
    
    next(error);
  }
};

export const getAllLoansDirect = async (req, res, next) => {
  try {
    const { status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Search by name, phone, or idNumber
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { idNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch all loans without pagination
    const loans = await Loan.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: loans.length,
      data: loans,
    });
  } catch (error) {
    console.error("Get All Loans Direct Error:", error);
    next(error);
  }
};


export const getLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    console.error("Get Loan By ID Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid loan ID format",
      });
    }
    
    next(error);
  }
};

export const updateLoan = async (req, res, next) => {
  try {
    const loanId = req.params.id;
    const updateData = { ...req.body };
    
    // Check if loan exists
    const existingLoan = await Loan.findById(loanId);
    if (!existingLoan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }
    
    // Handle image update
    if (req.file && req.file.cloudinaryResult) {
      // Delete old image from Cloudinary if exists
      if (existingLoan.customerImage?.public_id) {
        try {
          await cloudinary.uploader.destroy(existingLoan.customerImage.public_id);
          console.log("Deleted old image:", existingLoan.customerImage.public_id);
        } catch (cloudinaryError) {
          console.warn("Failed to delete old image:", cloudinaryError.message);
        }
      }
      
      // Add new image data
      updateData.customerImage = {
        url: req.file.cloudinaryResult.secure_url,
        public_id: req.file.cloudinaryResult.public_id,
      };
    }
    
    // Update loan
    const updatedLoan = await Loan.findByIdAndUpdate(
      loanId,
      updateData,
      { 
        new: true, // Return updated document
        runValidators: true // Run model validations
      }
    );

    res.status(200).json({
      success: true,
      message: "Loan updated successfully",
      data: updatedLoan,
    });
  } catch (error) {
    console.error("Update Loan Error:", error);
    
    if (error.code === 11000 && error.keyPattern?.idNumber) {
      return res.status(400).json({
        success: false,
        message: "ID number already exists",
      });
    }
    
    next(error);
  }
};

export const deleteLoanById = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Loan not found",
      });
    }
    
    // Delete image from Cloudinary if exists
    if (loan.customerImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(loan.customerImage.public_id);
        console.log("Deleted image from Cloudinary:", loan.customerImage.public_id);
      } catch (cloudinaryError) {
        console.warn("Failed to delete image from Cloudinary:", cloudinaryError.message);
      }
    }
    
    // Delete loan from database
    await Loan.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: "Loan deleted successfully",
    });
  } catch (error) {
    console.error("Delete Loan Error:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: "Invalid loan ID format",
      });
    }
    
    next(error);
  }
};

export const searchByIdNumber = async (req, res, next) => {
  try {
    const { idNumber } = req.params;
    
    const loan = await Loan.findOne({ idNumber });
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "No loan found for this ID number",
      });
    }

    res.status(200).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    console.error("Search By ID Error:", error);
    next(error);
  }
};

export const getLoanStatistics = async (req, res, next) => {
  try {
    const stats = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: "$loanAmount" },
          totalPayable: { $sum: "$totalPayable" },
          activeLoans: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          },
          closedLoans: {
            $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
          },
          avgLoanAmount: { $avg: "$loanAmount" },
          avgInterestRate: { $avg: "$interestRate" }
        }
      }
    ]);
    
    const statusDistribution = await Loan.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: stats[0] || {},
        statusDistribution
      }
    });
  } catch (error) {
    console.error("Get Statistics Error:", error);
    next(error);
  }
};

export const testCloudinary = async (req, res) => {
  try {
    // Test upload a sample image
    const result = await cloudinary.uploader.upload(
      'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      {
        folder: 'loan_customers_test',
        public_id: 'test_' + Date.now(),
      }
    );
    
    res.json({
      success: true,
      message: 'Cloudinary connection successful!',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes
      }
    });
  } catch (error) {
    console.error('Cloudinary Test Error:', error);
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
};





















