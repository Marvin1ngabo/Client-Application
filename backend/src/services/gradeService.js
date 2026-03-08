const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class GradeService {
  async getMyGrades(userId, filters = {}) {
    const student = await prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new AppError('Student not found', 404);
    }

    const where = { studentId: student.id };

    if (filters.term) where.term = filters.term;
    if (filters.subject) where.subject = filters.subject;
    if (filters.academicYear) where.academicYear = filters.academicYear;

    return await prisma.grade.findMany({
      where,
      include: {
        class: { select: { name: true, grade: true } },
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStudentGrades(studentId, filters = {}) {
    const where = { studentId };

    if (filters.term) where.term = filters.term;
    if (filters.subject) where.subject = filters.subject;
    if (filters.academicYear) where.academicYear = filters.academicYear;

    return await prisma.grade.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        class: { select: { name: true, grade: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addGrade(teacherId, data) {
    const { studentId, classId, subject, score, maxScore, term, academicYear } = data;

    if (score < 0 || maxScore < 0) {
      throw new AppError('Score and maxScore must be positive', 400);
    }

    if (parseFloat(score) > parseFloat(maxScore)) {
      throw new AppError('Score cannot exceed maxScore', 400);
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

    return await prisma.grade.create({
      data: {
        studentId,
        classId,
        subject,
        score,
        maxScore,
        term,
        academicYear,
        recordedBy: teacher.id,
      },
    });
  }

  async updateGrade(gradeId, teacherId, data) {
    const grade = await prisma.grade.findUnique({
      where: { id: gradeId },
      include: { class: true },
    });

    if (!grade) {
      throw new AppError('Grade not found', 404);
    }

    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (grade.class.teacherId !== teacher.id) {
      throw new AppError('You are not assigned to this class', 403);
    }

    if (data.score && data.maxScore && parseFloat(data.score) > parseFloat(data.maxScore)) {
      throw new AppError('Score cannot exceed maxScore', 400);
    }

    return await prisma.grade.update({
      where: { id: gradeId },
      data,
    });
  }

  async deleteGrade(gradeId) {
    return await prisma.grade.delete({
      where: { id: gradeId },
    });
  }
}

module.exports = new GradeService();
