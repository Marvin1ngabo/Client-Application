const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');
const prisma = require('../config/database');
const { successResponse } = require('../utils/response');

const router = express.Router();

// Get all classes
router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), checkDeviceVerification, async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, classes);
  } catch (error) {
    next(error);
  }
});

// Get class by ID
router.get('/:id', authenticate, authorize('ADMIN', 'TEACHER'), checkDeviceVerification, async (req, res, next) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        students: {
          include: {
            user: true,
          },
        },
      },
    });
    return successResponse(res, classData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
