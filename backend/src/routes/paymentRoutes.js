const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public routes (webhooks need to be accessible)
router.post('/webhook', paymentController.webhook);

// Authenticated routes
router.get('/verify', paymentController.verifyPayment);
router.get('/', authenticate, paymentController.getUserPayments);

// Admin routes
router.get('/admin/all', authenticate, isAdmin, paymentController.getAllPayments);

module.exports = router;
