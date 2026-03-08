const { PrismaClient } = require('@prisma/client');
const { errorResponse } = require('../utils/response');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

/**
 * Check if device is verified
 */
async function checkDeviceVerification(req, res, next) {
  try {
    const deviceId = req.headers['x-device-id'];

    if (!deviceId) {
      throw new AppError('Device ID is required', 400);
    }

    const device = await prisma.device.findFirst({
      where: {
        userId: req.user.id,
        deviceId: deviceId,
      },
    });

    if (!device) {
      throw new AppError('Device not registered', 403);
    }

    if (!device.isVerified) {
      throw new AppError('Device not verified. Please wait for admin approval.', 403);
    }

    req.device = device;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return errorResponse(res, error.message, error.statusCode);
    }
    return errorResponse(res, 'Device verification failed', 403);
  }
}

module.exports = checkDeviceVerification;
