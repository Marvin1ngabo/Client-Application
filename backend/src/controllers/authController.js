const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/response');
const AppError = require('../utils/AppError');

class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(
          res,
          'Validation failed',
          400,
          errors.array().map((err) => ({ field: err.path, message: err.msg }))
        );
      }

      const user = await authService.register(req.body);
      return successResponse(res, user, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorResponse(
          res,
          'Validation failed',
          400,
          errors.array().map((err) => ({ field: err.path, message: err.msg }))
        );
      }

      const { email, password, deviceId } = req.body;
      const result = await authService.login(email, password, deviceId);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return successResponse(res, {
        user: result.user,
        accessToken: result.accessToken,
        deviceVerified: result.deviceVerified,
      }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie('refreshToken');
      return successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
