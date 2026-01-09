const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Donors management
router.get('/donors', adminController.getDonors);
router.get('/donors/:id', adminController.getDonorDetails);
router.put('/donors/:id/toggle-status', adminController.toggleDonorStatus);

// Analytics
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

module.exports = router;
