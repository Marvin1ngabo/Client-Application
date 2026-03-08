const { PrismaClient } = require('@prisma/client');
const { successResponse } = require('../utils/response');

const prisma = new PrismaClient();

class DashboardController {
  async getStats(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      let stats = {};

      if (userRole === 'STUDENT') {
        // Get student's own data
        const student = await prisma.student.findUnique({
          where: { userId },
          include: {
            feeAccount: true,
            class: true,
          },
        });

        if (student) {
          // Calculate balance from transactions
          const deposits = await prisma.feeTransaction.aggregate({
            where: {
              feeAccountId: student.feeAccount.id,
              type: 'DEPOSIT',
              status: 'APPROVED',
            },
            _sum: { amount: true },
          });

          const withdrawals = await prisma.feeTransaction.aggregate({
            where: {
              feeAccountId: student.feeAccount.id,
              type: 'WITHDRAWAL',
              status: 'APPROVED',
            },
            _sum: { amount: true },
          });

          const balance = (deposits._sum.amount || 0) - (withdrawals._sum.amount || 0);

          // Get attendance stats
          const attendanceRecords = await prisma.attendance.findMany({
            where: { studentId: student.id },
          });

          const presentCount = attendanceRecords.filter(a => a.status === 'PRESENT').length;
          const absentCount = attendanceRecords.filter(a => a.status === 'ABSENT').length;
          const lateCount = attendanceRecords.filter(a => a.status === 'LATE').length;

          // Get grade stats
          const grades = await prisma.grade.findMany({
            where: { studentId: student.id },
          });

          const averageGrade = grades.length > 0
            ? grades.reduce((sum, g) => sum + (Number(g.score) / Number(g.maxScore) * 100), 0) / grades.length
            : 0;

          stats = {
            balance: Number(balance),
            className: student.class?.name || 'Not assigned',
            attendanceRate: attendanceRecords.length > 0 
              ? ((presentCount / attendanceRecords.length) * 100).toFixed(1)
              : 0,
            presentDays: presentCount,
            absentDays: absentCount,
            lateDays: lateCount,
            averageGrade: averageGrade.toFixed(1),
            totalGrades: grades.length,
          };
        }
      } else if (userRole === 'PARENT') {
        // Get parent's children data
        const children = await prisma.student.findMany({
          where: { parentId: userId },
          include: {
            user: true,
            feeAccount: true,
            class: true,
          },
        });

        stats = {
          totalChildren: children.length,
          children: children.map(child => ({
            id: child.id,
            name: `${child.user.firstName} ${child.user.lastName}`,
            className: child.class?.name || 'Not assigned',
          })),
        };
      } else if (userRole === 'TEACHER') {
        // Get teacher's classes
        const teacher = await prisma.teacher.findUnique({
          where: { userId },
          include: {
            classes: {
              include: {
                students: true,
              },
            },
          },
        });

        const totalStudents = teacher?.classes.reduce((sum, c) => sum + c.students.length, 0) || 0;

        stats = {
          totalClasses: teacher?.classes.length || 0,
          totalStudents,
          subjects: teacher?.subjects || [],
        };
      }

      return successResponse(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
