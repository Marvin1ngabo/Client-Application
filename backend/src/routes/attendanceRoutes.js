const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');

const router = express.Router();

router.get('/my', authenticate, checkDeviceVerification, attendanceController.getMyAttendance);
router.get('/:studentId', authenticate, authorize('ADMIN', 'TEACHER'), attendanceController.getStudentAttendance);
router.post('/', authenticate, authorize('TEACHER'), attendanceController.markAttendance);
router.patch('/:id', authenticate, authorize('TEACHER'), attendanceController.updateAttendance);

module.exports = router;
