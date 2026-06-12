const express = require('express');
const { 
  getPendingDrivers, 
  getApprovedDrivers, 
  getAllUsers,
  approveDriver, 
  rejectDriver,
  getDashboardStats,
  getAllRides,
  getAllDrivers,
  deleteUser
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect, authorize('admin'));

// Dashboard stats
router.get('/dashboard-stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);

// Driver management
router.get('/pending-drivers', getPendingDrivers);
router.get('/approved-drivers', getApprovedDrivers);
router.get('/all-drivers', getAllDrivers);
router.patch('/approve-driver/:driverId', approveDriver);
router.patch('/reject-driver/:driverId', rejectDriver);

// Ride management
router.get('/all-rides', getAllRides);

module.exports = router;
