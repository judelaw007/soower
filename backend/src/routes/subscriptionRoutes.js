const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const createSubscriptionValidation = [
  body('projectId').isUUID().withMessage('Valid project ID is required'),
  body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least 100'),
  body('interval')
    .isIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM'])
    .withMessage('Invalid interval'),
  body('customIntervalDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom interval must be at least 1 day'),
];

const updateSubscriptionValidation = [
  body('amount').optional().isFloat({ min: 100 }).withMessage('Amount must be at least 100'),
  body('interval')
    .optional()
    .isIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY', 'CUSTOM'])
    .withMessage('Invalid interval'),
  body('customIntervalDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Custom interval must be at least 1 day'),
];

// User routes
router.post('/', authenticate, createSubscriptionValidation, validate, subscriptionController.createSubscription);
router.get('/', authenticate, subscriptionController.getUserSubscriptions);
router.get('/:id', authenticate, subscriptionController.getSubscription);
router.put('/:id', authenticate, updateSubscriptionValidation, validate, subscriptionController.updateSubscription);
router.post('/:id/pause', authenticate, subscriptionController.pauseSubscription);
router.post('/:id/resume', authenticate, subscriptionController.resumeSubscription);
router.post('/:id/cancel', authenticate, subscriptionController.cancelSubscription);

// Admin routes
router.get('/admin/all', authenticate, isAdmin, subscriptionController.getAllSubscriptions);

module.exports = router;
