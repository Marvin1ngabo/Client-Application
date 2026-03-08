const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class AttendanceService {
  async getMyAttendance(userId, filters = {}) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const where = { studentId: student.id };

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return await prisma.attendance.findMany({
      where,
      include: {
        class: { select: { name: true, grade: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async getStudentAttendance(studentId, filters = {}) {
    const where = { studentId };

    if (filters.startDate && filters.endDate) {
      where.date = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    }

    return await prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async markAttendance(teacherId, data) {
    const { studentId, classId, date, status, notes } = data;

    // Verify date is not in future
    if (new Date(date) > new Date()) {
      throw new AppError('Attendance date cannot be in the future', 400);
    }

    // Verify teacher is assigned to class
    const classData = await prisma.class.findUnique({
      where: { id: classId },
    });

    if (!classData) {
      throw new AppError('Class not found', 404);
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (!teacher) {
      throw new AppError('Teacher not found', 404);
    }

    if (classData.teacherId !== teacher.id) {
      throw new AppError('You are not assigned to this class', 403);
    }

    // Check for duplicate
    const existing = await prisma.attendance.findUnique({
      where: {
        studentId_classId_date: {
          studentId,
          classId,
          date: new Date(date),
        },
      },
    });

    if (existing) {
      throw new AppError('Attendance already marked for this date', 400);
    }

    return await prisma.attendance.create({
      data: {
        studentId,
        classId,
        date: new Date(date),
        status,
        notes,
        markedBy: teacher.id,
      },
    });
  }

  async updateAttendance(attendanceId, teacherId, data) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { class: true },
    });

    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (attendance.class.teacherId !== teacher.id) {
      throw new AppError('You are not assigned to this class', 403);
    }

    return await prisma.attendance.update({
      where: { id: attendanceId },
      data,
    });
  }
}

module.exports = new AttendanceService();
