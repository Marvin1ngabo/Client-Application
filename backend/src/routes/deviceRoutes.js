const express = require('express');
const deviceController = require('../controllers/deviceController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', authenticate, deviceController.registerDevice);
router.get('/status', authenticate, deviceController.getDeviceStatus);
router.get('/', authenticate, authorize('ADMIN'), deviceController.getPendingDevices);
router.patch('/:id/verify', authenticate, authorize('ADMIN'), deviceController.verifyDevice);
router.patch('/:id/reject', authenticate, authorize('ADMIN'), deviceController.rejectDevice);

module.exports = router;
