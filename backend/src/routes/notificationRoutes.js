const express = require('express');
const notificationController = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');

const router = express.Router();

router.get('/', authenticate, checkDeviceVerification, notificationController.getMyNotifications);
router.patch('/:id/read', authenticate, checkDeviceVerification, notificationController.markAsRead);
router.post('/broadcast', authenticate, authorize('ADMIN'), notificationController.broadcastNotification);

module.exports = router;
