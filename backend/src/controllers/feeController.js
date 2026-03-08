const { validationResult } = require('express-validator');
const feeService = require('../services/feeService');
const { successResponse, errorResponse } = require('../utils/response');

class FeeController {
  async getBalance(req, res, next) {
    try {
      const balance = await feeService.getBalance(req.user.id);
      return successResponse(res, balance);
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await feeService.getTransactionHistory(req.user.id, limit);
      return successResponse(res, history);
    } catch (error) {
      next(error);
    }
  }

  async deposit(req, res, next) {
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

      const { amount, reference, description } = req.body;
      const transaction = await feeService.deposit(req.user.id, amount, reference, description);
      return successResponse(res, transaction, 'Deposit successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req, res, next) {
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

      const { amount, description } = req.body;
      const transaction = await feeService.withdraw(req.user.id, amount, description);
      return successResponse(res, transaction, 'Withdrawal request submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async approveTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await feeService.approveTransaction(id, req.user.id);
      return successResponse(res, transaction, 'Transaction approved');
    } catch (error) {
      next(error);
    }
  }

  async rejectTransaction(req, res, next) {
    try {
      const { id } = req.params;
      const transaction = await feeService.rejectTransaction(id);
      return successResponse(res, transaction, 'Transaction rejected');
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
      };
      const transactions = await feeService.getAllTransactions(filters);
      return successResponse(res, transactions);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeController();
