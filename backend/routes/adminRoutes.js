const express = require('express');
const { 
  getPendingDrivers, 
  getApprovedDrivers, 
  getAllUsers,
  approveDriver, 
  rejectDriver,
  getDashboardStats 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect, authorize('admin'));

// Dashboard stats
router.get('/dashboard-stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);

// Driver management
router.get('/pending-drivers', getPendingDrivers);
router.get('/approved-drivers', getApprovedDrivers);
router.patch('/approve-driver/:driverId', approveDriver);
router.patch('/reject-driver/:driverId', rejectDriver);

module.exports = router;
