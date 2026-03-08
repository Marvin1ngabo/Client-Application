const express = require('express');
const gradeController = require('../controllers/gradeController');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');

const router = express.Router();

router.get('/my', authenticate, checkDeviceVerification, gradeController.getMyGrades);
router.get('/:studentId', authenticate, authorize('ADMIN', 'TEACHER'), gradeController.getStudentGrades);
router.post('/', authenticate, authorize('TEACHER'), gradeController.addGrade);
router.patch('/:id', authenticate, authorize('TEACHER'), gradeController.updateGrade);
router.delete('/:id', authenticate, authorize('ADMIN'), gradeController.deleteGrade);

module.exports = router;
