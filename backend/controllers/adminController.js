const User = require('../models/User');
const Ride = require('../models/Ride');

// Get all pending driver applications
exports.getPendingDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'driver', status: 'pending' });
    const pendingDrivers = await User.find({ 
      role: 'driver', 
      status: 'pending' 
    })
      .select('-password')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      count: pendingDrivers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'driver', status: 'approved' });
    const approvedDrivers = await User.find({ 
      role: 'driver', 
      status: 'approved' 
    })
      .select('-password')
      .populate('approvedBy', 'fullName email')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      count: approvedDrivers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const pendingDrivers = await User.countDocuments({ role: 'driver', status: 'pending' });
    const approvedDrivers = await User.countDocuments({ role: 'driver', status: 'approved' });

    const stats = {
      totalUsers,
      admins: totalAdmins,
      clients: totalClients,
      drivers: totalDrivers,
      pendingDrivers,
      approvedDrivers,
    };

    const users = await User.find()
      .select('-password')
      .populate('approvedBy', 'fullName email')
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      stats,
      total: totalUsers,
      page,
      pages: Math.ceil(totalUsers / limit),
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
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const pendingDriverApprovals = await User.countDocuments({ role: 'driver', status: 'pending' });
    const approvedDrivers = await User.countDocuments({ role: 'driver', status: 'approved' });
    const rejectedDrivers = await User.countDocuments({ role: 'driver', status: 'rejected' });

    // Calculate dynamic indices
    const processedDrivers = approvedDrivers + rejectedDrivers;
    const applicationSuccessRate = processedDrivers > 0 
      ? Math.round((approvedDrivers / processedDrivers) * 100) 
      : 100;
    const documentAuthenticityIndex = totalDrivers > 0 
      ? Math.round((approvedDrivers / totalDrivers) * 100) 
      : 100;
    const backgroundVerificationCheck = totalDrivers > 0 
      ? Math.round((processedDrivers / totalDrivers) * 100) 
      : 100;

    // Calculate dynamic growth trends
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recentUsersCount = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const priorUsersCount = await User.countDocuments({ createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } });
    const userTrend = priorUsersCount > 0 
      ? Math.round(((recentUsersCount - priorUsersCount) / priorUsersCount) * 100)
      : recentUsersCount > 0 ? 100 : 0;

    const recentDriversCount = await User.countDocuments({ role: 'driver', createdAt: { $gte: sevenDaysAgo } });
    const priorDriversCount = await User.countDocuments({ role: 'driver', createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } });
    const driverTrend = priorDriversCount > 0
      ? Math.round(((recentDriversCount - priorDriversCount) / priorDriversCount) * 100)
      : recentDriversCount > 0 ? 100 : 0;

    const pendingTrend = totalDrivers > 0
      ? Math.round((pendingDriverApprovals / totalDrivers) * 100)
      : 0;

    // Fetch ride statistics
    const totalRides = await Ride.countDocuments();
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const cancelledRides = await Ride.countDocuments({ status: 'cancelled' });
    const activeRides = await Ride.countDocuments({ status: { $in: ['accepted', 'driver_assigned', 'driver_arrived', 'ride_started'] } });
    
    const completedRidesList = await Ride.find({ status: 'completed' }).select('fare');
    const totalRevenue = completedRidesList.reduce((sum, r) => sum + (r.fare || 0), 0);

    // Last 7 days business chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const startOfDay = new Date();
      startOfDay.setDate(startOfDay.getDate() - i);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setDate(endOfDay.getDate() - i);
      endOfDay.setHours(23, 59, 59, 999);

      const dayBookings = await Ride.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      const dayCompletedRides = await Ride.find({
        status: 'completed',
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }).select('fare');

      const dayRevenue = dayCompletedRides.reduce((sum, r) => sum + (r.fare || 0), 0);

      const dateLabel = startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      chartData.push({
        label: dateLabel,
        bookings: dayBookings,
        revenue: dayRevenue
      });
    }

    // Fetch recent users/registrations to construct dynamic logs
    const recentUsers = await User.find()
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('approvedBy', 'fullName');

    const activities = [];
    for (const u of recentUsers) {
      if (u.role === 'driver') {
        if (u.status === 'pending') {
          activities.push({
            iconName: 'UserCheck',
            text: `Chauffeur application received: ${u.fullName}`,
            time: u.createdAt,
            type: 'warning'
          });
        } else if (u.status === 'approved') {
          const approverName = u.approvedBy ? u.approvedBy.fullName : 'Admin';
          activities.push({
            iconName: 'CheckCircle',
            text: `Chauffeur approved: ${u.fullName} (by ${approverName})`,
            time: u.approvalDate || u.updatedAt,
            type: 'success'
          });
        } else if (u.status === 'rejected') {
          activities.push({
            iconName: 'XCircle',
            text: `Chauffeur application rejected: ${u.fullName}`,
            time: u.updatedAt,
            type: 'error'
          });
        }
      } else if (u.role === 'client') {
        activities.push({
          iconName: 'Users',
          text: `New client registration: ${u.fullName}`,
          time: u.createdAt,
          type: 'info'
        });
      } else if (u.role === 'admin') {
        activities.push({
          iconName: 'Shield',
          text: `Admin access granted: ${u.fullName}`,
          time: u.createdAt,
          type: 'success'
        });
      }
    }

    const stats = {
      totalUsers,
      totalAdmins,
      totalClients,
      totalDrivers,
      pendingDriverApprovals,
      approvedDrivers,
      rejectedDrivers,
      qualityIndex: {
        applicationSuccessRate,
        documentAuthenticityIndex,
        backgroundVerificationCheck
      },
      trends: {
        userTrend,
        driverTrend,
        pendingTrend,
        approvedTrend: applicationSuccessRate
      },
      activities,
      businessStats: {
        totalRides,
        completedRides,
        cancelledRides,
        activeRides,
        totalRevenue
      },
      chartData
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

// Get all rides (admin only)
exports.getAllRides = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await Ride.countDocuments();
    const rides = await Ride.find()
      .populate('client', 'fullName email phone')
      .populate('driver', 'fullName phone vehicleNumber vehicleType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      count: rides.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      rides 
    });
  } catch (error) {
    console.error('Get all rides error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch rides' });
  }
};

// Get all drivers (admin only) - combines pending, approved, and rejected
exports.getAllDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'driver' });
    const pending = await User.countDocuments({ role: 'driver', status: 'pending' });
    const approved = await User.countDocuments({ role: 'driver', status: 'approved' });
    const rejected = await User.countDocuments({ role: 'driver', status: 'rejected' });

    const stats = {
      total,
      pending,
      approved,
      rejected,
    };

    const drivers = await User.find({ role: 'driver' })
      .select('-password')
      .populate('approvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({ 
      success: true, 
      stats,
      total,
      page,
      pages: Math.ceil(total / limit),
      drivers 
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    return res.status(500).json({ success: false, message: 'Unable to fetch drivers' });
  }
};

// Delete a user (admin only) - soft delete deactivation
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
    }

    user.isActive = false;
    const timestamp = Date.now();
    const originalEmail = user.email;
    user.email = `deactivated_${timestamp}_${user.email}`;
    user.phone = `deactivated_${timestamp}_${user.phone}`;
    await user.save();

    return res.status(200).json({ 
      success: true, 
      message: `User ${user.fullName} (${originalEmail}) has been deactivated successfully` 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, message: 'Unable to delete user' });
  }
};
