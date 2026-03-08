const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const checkDeviceVerification = require('../middlewares/deviceCheck');
const prisma = require('../config/database');
const { successResponse } = require('../utils/response');

const router = express.Router();

// Get all students
router.get('/', authenticate, authorize('ADMIN', 'TEACHER'), checkDeviceVerification, async (req, res, next) => {
  try {
    const students = await prisma.student.findMany({
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
        class: {
          select: {
            id: true,
            name: true,
            academicYear: true,
          },
        },
        _count: {
          select: {
            grades: true,
            attendance: true,
          },
        },
      },
      orderBy: { admissionNumber: 'asc' },
    });
    return successResponse(res, students);
  } catch (error) {
    next(error);
  }
});

// Get student by ID
router.get('/:id', authenticate, authorize('ADMIN', 'TEACHER'), checkDeviceVerification, async (req, res, next) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        class: true,
        grades: true,
        attendance: true,
      },
    });
    return successResponse(res, student);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
