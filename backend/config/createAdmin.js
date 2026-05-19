const User = require("../models/User");

const createAdmin = async () => {
  try {
    const adminExists = await User.findOne({
      email: "pritam.mondal@devqor.in",
    });

    if (!adminExists) {
      await User.create({
        fullName: "Pritam Mondal",
        email: "pritam.mondal@devqor.in",
        phone: "+91-9876543210",
        password: "123456789",
        role: "admin",
        isApproved: true,
        status: "approved",
        approvalDate: new Date(),
      });

      console.log("✅ Admin User Created Successfully");
      console.log("📧 Email: pritam.mondal@devqor.in");
      console.log("🔐 Password: 123456789");
    } else {
      console.log("✅ Admin already exists");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error.message);
  }
};

module.exports = createAdmin;