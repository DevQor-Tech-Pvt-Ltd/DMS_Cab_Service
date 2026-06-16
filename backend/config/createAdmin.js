const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  try {

    // Validate environment variables
    if (
      !process.env.ADMIN_NAME ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error("Admin environment variables are missing");
    }

    // Check if admin already exists
    const adminExists = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (!adminExists) {

      // Hash password
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        10
      );

      // Create admin
      await User.create({
        fullName: process.env.ADMIN_NAME,
        email: process.env.ADMIN_EMAIL,
        phone: "+91-9876543210",
        password: hashedPassword,
        role: "admin",
        isApproved: true,
        status: "approved",
        approvalDate: new Date(),
      });

      console.log("✅ Admin User Created Successfully");

    } else {
      console.log("✅ Admin already exists");
    }

  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

module.exports = createAdmin;