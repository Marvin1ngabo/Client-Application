const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');
const prisma = require('../config/database');
const { successResponse } = require('../utils/response');

const router = express.Router();

// Get all users
router.get('/', authenticate, authorize('ADMIN'), checkDeviceVerification, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, authorize('ADMIN'), checkDeviceVerification, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return successResponse(res, user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
