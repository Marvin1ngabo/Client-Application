const attendanceService = require('../services/attendanceService');
const { successResponse } = require('../utils/response');

class AttendanceController {
  async getMyAttendance(req, res, next) {
    try {
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      const attendance = await attendanceService.getMyAttendance(req.user.id, filters);
      return successResponse(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async getStudentAttendance(req, res, next) {
    try {
      const { studentId } = req.params;
      const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
      };
      const attendance = await attendanceService.getStudentAttendance(studentId, filters);
      return successResponse(res, attendance);
    } catch (error) {
      next(error);
    }
  }

  async markAttendance(req, res, next) {
    try {
      const attendance = await attendanceService.markAttendance(req.user.id, req.body);
      return successResponse(res, attendance, 'Attendance marked successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAttendance(req, res, next) {
    try {
      const { id } = req.params;
      const attendance = await attendanceService.updateAttendance(id, req.user.id, req.body);
      return successResponse(res, attendance, 'Attendance updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
