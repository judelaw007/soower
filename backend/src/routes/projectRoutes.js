const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules
const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('imageUrl').optional().isURL().withMessage('Image URL must be a valid URL'),
  body('hasGoal').optional().isBoolean(),
  body('goalAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Goal amount must be a positive number'),
];

// Public routes
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);

// Admin routes
router.post('/', authenticate, isAdmin, projectValidation, validate, projectController.createProject);
router.put('/:id', authenticate, isAdmin, projectValidation, validate, projectController.updateProject);
router.delete('/:id', authenticate, isAdmin, projectController.deleteProject);
router.get('/:id/stats', authenticate, isAdmin, projectController.getProjectStats);

module.exports = router;
