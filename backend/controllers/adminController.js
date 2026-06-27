const User = require('../models/User');
const Ride = require('../models/Ride');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

// Get all pending driver applications
exports.getPendingDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'driver', status: 'pending', isActive: { $ne: false } });
    const pendingDrivers = await User.find({ 
      role: 'driver', 
      status: 'pending',
      isActive: { $ne: false }
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
    logger.error('Get pending drivers error: %s', error.message);
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

    const total = await User.countDocuments({ role: 'driver', status: 'approved', isActive: { $ne: false } });
    const approvedDrivers = await User.find({ 
      role: 'driver', 
      status: 'approved',
      isActive: { $ne: false }
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
    logger.error('Get approved drivers error: %s', error.message);
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

    const totalUsers = await User.countDocuments({ isActive: { $ne: false } });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: { $ne: false } });
    const totalClients = await User.countDocuments({ role: 'client', isActive: { $ne: false } });
    const totalDrivers = await User.countDocuments({ role: 'driver', isActive: { $ne: false } });
    const pendingDrivers = await User.countDocuments({ role: 'driver', status: 'pending', isActive: { $ne: false } });
    const approvedDrivers = await User.countDocuments({ role: 'driver', status: 'approved', isActive: { $ne: false } });

    const stats = {
      totalUsers,
      admins: totalAdmins,
      clients: totalClients,
      drivers: totalDrivers,
      pendingDrivers,
      approvedDrivers,
    };

    const users = await User.find({ isActive: { $ne: false } })
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
    logger.error('Get all users error: %s', error.message);
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

    const driver = await User.findOne({ _id: driverId, isActive: { $ne: false } });
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

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Structured audit log (Audit 13.1)
    logger.info('[ADMIN_ACTION] admin=%s | action=APPROVE_DRIVER | driverId=%s | driverEmail=%s', req.user.email, driverId, driver.email);

    return res.status(200).json({ 
      success: true, 
      message: 'Driver approved successfully',
      driver: driver.toJSON() 
    });
  } catch (error) {
    logger.error('Approve driver error: %s', error.message);
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

    const driver = await User.findOne({ _id: driverId, isActive: { $ne: false } });
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
    await driver.save();

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Structured audit log (Audit 13.1)
    logger.info('[ADMIN_ACTION] admin=%s | action=REJECT_DRIVER | driverId=%s | driverEmail=%s | reason=%s', req.user.email, driverId, driver.email, reason || 'none');

    return res.status(200).json({ 
      success: true, 
      message: 'Driver rejected',
      driver: driver.toJSON() 
    });
  } catch (error) {
    logger.error('Reject driver error: %s', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Unable to reject driver' 
    });
  }
};

// Get dashboard stats for admin
exports.getDashboardStats = async (req, res) => {
  try {
    const DASHBOARD_CACHE_KEY = 'admin_dashboard_stats';
    
    // Check in-memory cache first
    const cachedStats = cache.get(DASHBOARD_CACHE_KEY);
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        stats: cachedStats
      });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // 1. Facet user counts (Active users only)
    const userStats = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $match: { isActive: { $ne: false } } }, { $count: 'count' }],
          admins: [{ $match: { role: 'admin', isActive: { $ne: false } } }, { $count: 'count' }],
          clients: [{ $match: { role: 'client', isActive: { $ne: false } } }, { $count: 'count' }],
          drivers: [{ $match: { role: 'driver', isActive: { $ne: false } } }, { $count: 'count' }],
          pendingDriverApprovals: [{ $match: { role: 'driver', status: 'pending', isActive: { $ne: false } } }, { $count: 'count' }],
          approvedDrivers: [{ $match: { role: 'driver', status: 'approved', isActive: { $ne: false } } }, { $count: 'count' }],
          rejectedDrivers: [{ $match: { role: 'driver', status: 'rejected', isActive: { $ne: false } } }, { $count: 'count' }],
          recentUsersCount: [{ $match: { createdAt: { $gte: sevenDaysAgo }, isActive: { $ne: false } } }, { $count: 'count' }],
          priorUsersCount: [{ $match: { createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }, isActive: { $ne: false } } }, { $count: 'count' }],
          recentDriversCount: [{ $match: { role: 'driver', createdAt: { $gte: sevenDaysAgo }, isActive: { $ne: false } } }, { $count: 'count' }],
          priorDriversCount: [{ $match: { role: 'driver', createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }, isActive: { $ne: false } } }, { $count: 'count' }]
        }
      }
    ]);

    const uStats = userStats[0] || {};
    const totalUsers = uStats.totalUsers?.[0]?.count || 0;
    const totalAdmins = uStats.admins?.[0]?.count || 0;
    const totalClients = uStats.clients?.[0]?.count || 0;
    const totalDrivers = uStats.drivers?.[0]?.count || 0;
    const pendingDriverApprovals = uStats.pendingDriverApprovals?.[0]?.count || 0;
    const approvedDrivers = uStats.approvedDrivers?.[0]?.count || 0;
    const rejectedDrivers = uStats.rejectedDrivers?.[0]?.count || 0;
    const recentUsersCount = uStats.recentUsersCount?.[0]?.count || 0;
    const priorUsersCount = uStats.priorUsersCount?.[0]?.count || 0;
    const recentDriversCount = uStats.recentDriversCount?.[0]?.count || 0;
    const priorDriversCount = uStats.priorDriversCount?.[0]?.count || 0;

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

    const userTrend = priorUsersCount > 0 
      ? Math.round(((recentUsersCount - priorUsersCount) / priorUsersCount) * 100)
      : recentUsersCount > 0 ? 100 : 0;

    const driverTrend = priorDriversCount > 0
      ? Math.round(((recentDriversCount - priorDriversCount) / priorDriversCount) * 100)
      : recentDriversCount > 0 ? 100 : 0;

    const pendingTrend = totalDrivers > 0
      ? Math.round((pendingDriverApprovals / totalDrivers) * 100)
      : 0;

    // 2. Facet ride counts and total revenue
    const rideStats = await Ride.aggregate([
      {
        $facet: {
          totalRides: [{ $count: 'count' }],
          completedRides: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          cancelledRides: [{ $match: { status: 'cancelled' } }, { $count: 'count' }],
          activeRides: [{ $match: { status: { $in: ['accepted', 'driver_assigned', 'driver_arrived', 'ride_started'] } } }, { $count: 'count' }],
          revenue: [
            { $match: { status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$fare' } } }
          ]
        }
      }
    ]);

    const rStats = rideStats[0] || {};
    const totalRides = rStats.totalRides?.[0]?.count || 0;
    const completedRides = rStats.completedRides?.[0]?.count || 0;
    const cancelledRides = rStats.cancelledRides?.[0]?.count || 0;
    const activeRides = rStats.activeRides?.[0]?.count || 0;
    const totalRevenue = rStats.revenue?.[0]?.total || 0;

    // 3. Date-grouping aggregation for chart data
    const startOfChartPeriod = new Date();
    startOfChartPeriod.setDate(startOfChartPeriod.getDate() - 6);
    startOfChartPeriod.setHours(0, 0, 0, 0);

    const dailyStats = await Ride.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfChartPeriod }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' }
          },
          bookings: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, '$fare', 0]
            }
          }
        }
      }
    ]);

    // Construct chartData
    const chartData = [];
    const statsMap = new Map(dailyStats.map(s => [s._id, s]));

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const offsetDate = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const key = `${offsetDate.getFullYear()}-${String(offsetDate.getMonth() + 1).padStart(2, '0')}-${String(offsetDate.getDate()).padStart(2, '0')}`;
      
      const dayStat = statsMap.get(key) || { bookings: 0, revenue: 0 };
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });

      chartData.push({
        label: dateLabel,
        bookings: dayStat.bookings,
        revenue: dayStat.revenue
      });
    }

    // Fetch recent users/registrations to construct dynamic logs
    const recentUsers = await User.find({ isActive: { $ne: false } })
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

    // Store in cache for 30 seconds
    cache.set(DASHBOARD_CACHE_KEY, stats, 30);

    return res.status(200).json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    logger.error('Get dashboard stats error: %s', error.message);
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
      .populate('driver', 'fullName phone vehicleNumber vehicleType averageRating')
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
    logger.error('Get all rides error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Unable to fetch rides' });
  }
};

// Get all drivers (admin only) - combines pending, approved, and rejected
exports.getAllDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments({ role: 'driver', isActive: { $ne: false } });
    const pending = await User.countDocuments({ role: 'driver', status: 'pending', isActive: { $ne: false } });
    const approved = await User.countDocuments({ role: 'driver', status: 'approved', isActive: { $ne: false } });
    const rejected = await User.countDocuments({ role: 'driver', status: 'rejected', isActive: { $ne: false } });

    const stats = {
      total,
      pending,
      approved,
      rejected,
    };

    const drivers = await User.find({ role: 'driver', isActive: { $ne: false } })
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
    logger.error('Get all drivers error: %s', error.message);
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

    // Invalidate dashboard stats cache
    cache.clearDashboardCache();

    // Structured audit log (Audit 13.1)
    logger.info('[ADMIN_ACTION] admin=%s | action=DELETE_USER | targetId=%s | targetEmail=%s | targetRole=%s', req.user.email, id, originalEmail, user.role);

    return res.status(200).json({ 
      success: true, 
      message: `User ${user.fullName} (${originalEmail}) has been deactivated successfully` 
    });
  } catch (error) {
    logger.error('Delete user error: %s', error.message);
    return res.status(500).json({ success: false, message: 'Unable to delete user' });
  }
};
