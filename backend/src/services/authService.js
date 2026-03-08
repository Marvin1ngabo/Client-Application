const { PrismaClient } = require('@prisma/client');
const { hashPassword, verifyPassword, generateSalt } = require('../utils/crypto');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class AuthService {
  async register(data) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Hash password
    const salt = generateSalt(parseInt(process.env.SALT_ROUNDS) || 16);
    const passwordHash = hashPassword(data.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(email, password, deviceId) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError('Account temporarily locked. Please try again later.', 403);
    }

    // Verify password
    const isValidPassword = verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      // Increment failed login attempts
      const failedLogins = user.failedLogins + 1;
      const updateData = { failedLogins };

      // Lock account after 5 failed attempts
      if (failedLogins >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new AppError('Invalid credentials', 401);
    }

    // Reset failed login attempts
    if (user.failedLogins > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLogins: 0, lockedUntil: null },
      });
    }

    // Check or create device
    let device = await prisma.device.findFirst({
      where: {
        userId: user.id,
        deviceId,
      },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceId,
        },
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      accessToken,
      refreshToken,
      deviceVerified: device.isVerified,
    };
  }

  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}

module.exports = new AuthService();
