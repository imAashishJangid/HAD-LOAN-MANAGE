// routes/loanRoutes.js
import express from "express";
import Loan from "../models/Loan.js"; // mongoose model
import Customer from "../models/Customer.js";

const router = express.Router();

// ===== Route 1: Loan stats for chart =====
router.get("/loan-stats", async (req, res) => {
  try {
    // Example aggregation: total disbursed and collected per month
    const stats = await Loan.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          disbursed: { $sum: "$amount" },
          collected: { $sum: "$collectedAmount" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Convert month number to name
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const formattedStats = stats.map(s => ({
      month: monthNames[s._id - 1],
      disbursed: s.disbursed,
      collected: s.collected,
    }));

    res.json(formattedStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== Route 2: Overdue EMIs =====
router.get("/overdue-emis", async (req, res) => {
  try {
    const today = new Date();

    // Find loans where dueDate is past and full amount not collected
    const overdueLoans = await Loan.find({ 
      dueDate: { $lt: today }, 
      $expr: { $lt: ["$collectedAmount", "$amount"] }
    })
    .populate("customer", "name phone")
    .limit(20)
    .sort({ dueDate: 1 });

    const data = overdueLoans.map(loan => {
      const daysOverdue = Math.floor((today.getTime() - new Date(loan.dueDate).getTime()) / (1000*60*60*24));
      return {
        id: loan._id,
        customer: loan.customer.name,
        loanId: loan.loanId,
        amount: `₹${loan.amount.toLocaleString()}`,
        daysOverdue,
        phone: loan.customer.phone,
      };
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== Route 3: Recent Loan Applications =====
router.get("/recent-loans", async (req, res) => {
  try {
    // Recent 5 loans, latest created first
    const loans = await Loan.find()
      .populate("customer", "name") // customer name
      .sort({ createdAt: -1 })
      .limit(5);

    const data = loans.map(loan => ({
      id: loan._id,
      customer: loan.customer.name,
      initials: loan.customer.name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase(),
      amount: `₹${loan.amount.toLocaleString()}`,
      type: loan.loanType || "Loan", // agar field loanType hai
      status: loan.status || "pending", // default pending
      date: loan.createdAt.toLocaleString(), // ya relative time convert kar sakte ho frontend me
    }));

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ===== Dashboard Stats =====
router.get("/dashboard-stats", async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeLoans = await Loan.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const approvedThisMonth = await Loan.countDocuments({
      status: "approved",
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    const overdueEMIs = await Loan.aggregate([
      { $match: { dueDate: { $lt: new Date() }, status: "approved", paid: false } },
      { $group: { _id: null, totalOverdue: { $sum: "$amount" }, customers: { $sum: 1 } } },
    ]);

    const emiCollectedThisMonth = await Loan.aggregate([
      {
        $match: {
          status: "approved",
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, total: { $sum: "$collectedAmount" } } },
    ]);

    const recoveryRate = await Loan.aggregate([
      {
        $group: {
          _id: null,
          totalCollected: { $sum: "$collectedAmount" },
          totalDisbursed: { $sum: "$amount" },
        },
      },
    ]);

    const pendingApplications = await Loan.countDocuments({ status: "pending" });

    res.json({
      totalCustomers,
      activeLoans: activeLoans[0]?.totalAmount || 0,
      approvedThisMonth,
      overdueEMIs: overdueEMIs[0]?.totalOverdue || 0,
      overdueCustomers: overdueEMIs[0]?.customers || 0,
      emiCollectedThisMonth: emiCollectedThisMonth[0]?.total || 0,
      recoveryRate: recoveryRate[0]
        ? ((recoveryRate[0].totalCollected / recoveryRate[0].totalDisbursed) * 100).toFixed(1)
        : 0,
      pendingApplications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



export default router;
