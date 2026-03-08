const { PrismaClient } = require('@prisma/client');
const AppError = require('../utils/AppError');

const prisma = new PrismaClient();

class NotificationService {
  async getMyNotifications(userId, limit = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  async broadcastNotification(data) {
    const { title, message, type, targetRole, targetUserIds } = data;

    let userIds = [];

    if (targetUserIds && targetUserIds.length > 0) {
      userIds = targetUserIds;
    } else if (targetRole) {
      const users = await prisma.user.findMany({
        where: { role: targetRole, isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    } else {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    }

    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    return { count: notifications.length };
  }
}

module.exports = new NotificationService();
