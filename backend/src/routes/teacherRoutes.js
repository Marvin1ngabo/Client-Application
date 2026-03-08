const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');
const prisma = require('../config/database');
const { successResponse } = require('../utils/response');

const router = express.Router();

// Get all teachers
router.get('/', authenticate, authorize('ADMIN'), checkDeviceVerification, async (req, res, next) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            classes: true,
            grades: true,
            attendance: true,
          },
        },
      },
      orderBy: { employeeNumber: 'asc' },
    });
    return successResponse(res, teachers);
  } catch (error) {
    next(error);
  }
});

// Get teacher by ID
router.get('/:id', authenticate, authorize('ADMIN'), checkDeviceVerification, async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        classes: true,
      },
    });
    return successResponse(res, teacher);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
