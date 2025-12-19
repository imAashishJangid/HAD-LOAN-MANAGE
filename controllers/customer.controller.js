export const createCustomer = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    const customer = new Customer({
      ...req.body,
      image: req.file ? req.file.filename : null,
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created",
      customer,
    });
  } catch (error) {
    console.error("Create customer error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
