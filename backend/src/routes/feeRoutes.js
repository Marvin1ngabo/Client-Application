const express = require('express');
const feeController = require('../controllers/feeController');
const { depositValidator, withdrawValidator } = require('../validators/feeValidator');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');

const router = express.Router();

router.get('/balance', authenticate, checkDeviceVerification, feeController.getBalance);
router.get('/history', authenticate, checkDeviceVerification, feeController.getHistory);
router.post('/deposit', authenticate, checkDeviceVerification, depositValidator, feeController.deposit);
router.post('/withdraw', authenticate, checkDeviceVerification, withdrawValidator, feeController.withdraw);
router.patch('/transactions/:id/approve', authenticate, authorize('ADMIN'), feeController.approveTransaction);
router.patch('/transactions/:id/reject', authenticate, authorize('ADMIN'), feeController.rejectTransaction);
router.get('/all', authenticate, authorize('ADMIN'), feeController.getAllTransactions);

module.exports = router;
