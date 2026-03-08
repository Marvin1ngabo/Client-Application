const gradeService = require('../services/gradeService');
const { successResponse } = require('../utils/response');

class GradeController {
  async getMyGrades(req, res, next) {
    try {
      const filters = {
        term: req.query.term,
        subject: req.query.subject,
        academicYear: req.query.academicYear,
      };
      const grades = await gradeService.getMyGrades(req.user.id, filters);
      return successResponse(res, grades);
    } catch (error) {
      next(error);
    }
  }

  async getStudentGrades(req, res, next) {
    try {
      const { studentId } = req.params;
      const filters = {
        term: req.query.term,
        subject: req.query.subject,
        academicYear: req.query.academicYear,
      };
      const grades = await gradeService.getStudentGrades(studentId, filters);
      return successResponse(res, grades);
    } catch (error) {
      next(error);
    }
  }

  async addGrade(req, res, next) {
    try {
      const grade = await gradeService.addGrade(req.user.id, req.body);
      return successResponse(res, grade, 'Grade added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateGrade(req, res, next) {
    try {
      const { id } = req.params;
      const grade = await gradeService.updateGrade(id, req.user.id, req.body);
      return successResponse(res, grade, 'Grade updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteGrade(req, res, next) {
    try {
      const { id } = req.params;
      await gradeService.deleteGrade(id);
      return successResponse(res, null, 'Grade deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();
