const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class DeviceService {
  async registerDevice(userId, deviceId) {
    const existing = await prisma.device.findFirst({
      where: { userId, deviceId },
    });

    if (existing) {
      return existing;
    }

    return await prisma.device.create({
      data: { userId, deviceId },
    });
  }

  async getDeviceStatus(userId, deviceId) {
    const device = await prisma.device.findFirst({
      where: { userId, deviceId },
    });

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    return {
      isVerified: device.isVerified,
      verifiedAt: device.verifiedAt,
    };
  }

  async getPendingDevices() {
    return await prisma.device.findMany({
      where: { isVerified: false },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDevice(deviceId, adminId) {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new AppError('Device not found', 404);
    }

    return await prisma.device.update({
      where: { id: deviceId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
    });
  }

  async rejectDevice(deviceId) {
    return await prisma.device.delete({
      where: { id: deviceId },
    });
  }
}

module.exports = new DeviceService();
