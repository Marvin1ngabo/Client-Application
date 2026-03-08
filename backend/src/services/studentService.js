const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class StudentService {
  async getAllStudents(filters = {}) {
    const where = {};

    if (filters.classId) {
      where.classId = filters.classId;
    }

    return await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            grade: true,
          },
        },
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { enrollmentDate: 'desc' },
    });
  }

  async getStudentById(studentId) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        class: true,
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        feeAccount: true,
      },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    return student;
  }

  async createStudent(data) {
    const { userId, parentId, classId, studentNumber } = data;

    // Check if student number is unique
    const existing = await prisma.student.findUnique({
      where: { studentNumber },
    });

    if (existing) {
      throw new AppError('Student number already exists', 400);
    }

    return await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          userId,
          parentId,
          classId,
          studentNumber,
        },
      });

      // Create fee account
      await tx.feeAccount.create({
        data: {
          studentId: student.id,
        },
      });

      return student;
    });
  }

  async updateStudent(studentId, data) {
    return await prisma.student.update({
      where: { id: studentId },
      data,
    });
  }
}

module.exports = new StudentService();
