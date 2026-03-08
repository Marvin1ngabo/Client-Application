const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class ClassService {
  async getAllClasses(filters = {}) {
    const where = {};

    if (filters.academicYear) {
      where.academicYear = filters.academicYear;
    }

    return await prisma.class.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: { students: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClassById(classId) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new AppError('Class not found', 404);
    }

    return classData;
  }

  async createClass(data) {
    return await prisma.class.create({
      data,
    });
  }

  async updateClass(classId, data) {
    return await prisma.class.update({
      where: { id: classId },
      data,
    });
  }

  async deleteClass(classId) {
    return await prisma.class.delete({
      where: { id: classId },
    });
  }

  async assignTeacher(classId, teacherId) {
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    return await prisma.class.update({
      where: { id: classId },
      data: { teacherId },
    });
  }
}

module.exports = new ClassService();
