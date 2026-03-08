const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Don't expose stack trace in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    return errorResponse(res, 'Internal server error', 500);
  }

  return errorResponse(res, message, statusCode, err.errors);
}

module.exports = errorHandler;
