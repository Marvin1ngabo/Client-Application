const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// All dashboard routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/dashboard/stats
 * @desc    Get dashboard statistics based on user role
 * @access  Authenticated users
 */
router.get('/stats', dashboardController.getStats);

module.exports = router;
