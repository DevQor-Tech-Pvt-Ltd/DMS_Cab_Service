const User = require('../models/User');

// Get all pending driver applications
exports.getPendingDrivers = async (req, res) => {
  try {
    const pendingDrivers = await User.find({ 
      role: 'driver', 
      status: 'pending' 
    }).select('-password');

    return res.status(200).json({ 
      success: true, 
      count: pendingDrivers.length,
      drivers: pendingDrivers 
    });
  } catch (error) {
    console.error('Get pending drivers error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch pending drivers' 
    });
  }
};

// Get all approved drivers
exports.getApprovedDrivers = async (req, res) => {
  try {
    const approvedDrivers = await User.find({ 
      role: 'driver', 
      status: 'approved' 
    }).select('-password').populate('approvedBy', 'fullName email');

    return res.status(200).json({ 
      success: true, 
      count: approvedDrivers.length,
      drivers: approvedDrivers 
    });
  } catch (error) {
    console.error('Get approved drivers error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch approved drivers' 
    });
  }
};

// Get all users (clients, drivers, admins)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('approvedBy', 'fullName email');

    const stats = {
      totalUsers: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      clients: users.filter(u => u.role === 'client').length,
      drivers: users.filter(u => u.role === 'driver').length,
      pendingDrivers: users.filter(u => u.role === 'driver' && u.status === 'pending').length,
      approvedDrivers: users.filter(u => u.role === 'driver' && u.status === 'approved').length,
    };

    return res.status(200).json({ 
      success: true, 
      stats,
      users 
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch users' 
    });
  }
};

// Approve driver application
exports.approveDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }

    if (driver.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Driver is already approved' 
      });
    }

    driver.status = 'approved';
    driver.isApproved = true;
    driver.approvedBy = req.user._id;
    driver.approvalDate = new Date();
    await driver.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Driver approved successfully',
      driver: driver.toJSON() 
    });
  } catch (error) {
    console.error('Approve driver error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to approve driver' 
    });
  }
};

// Reject driver application
exports.rejectDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { reason } = req.body;

    const driver = await User.findById(driverId);
    if (!driver || driver.role !== 'driver') {
      return res.status(404).json({ 
        success: false, 
        message: 'Driver not found' 
      });
    }

    if (driver.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reject an approved driver' 
      });
    }

    driver.status = 'rejected';
    driver.isApproved = false;
    driver.approvedBy = req.user._id;
    driver.approvalDate = new Date();
    // Note: You could store rejection reason if you add it to the schema
    await driver.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Driver rejected',
      driver: driver.toJSON() 
    });
  } catch (error) {
    console.error('Reject driver error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to reject driver' 
    });
  }
};

// Get dashboard stats for admin
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments(),
      totalAdmins: await User.countDocuments({ role: 'admin' }),
      totalClients: await User.countDocuments({ role: 'client' }),
      totalDrivers: await User.countDocuments({ role: 'driver' }),
      pendingDriverApprovals: await User.countDocuments({ role: 'driver', status: 'pending' }),
      approvedDrivers: await User.countDocuments({ role: 'driver', status: 'approved' }),
      rejectedDrivers: await User.countDocuments({ role: 'driver', status: 'rejected' }),
    };

    return res.status(200).json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to fetch dashboard stats' 
    });
  }
};
