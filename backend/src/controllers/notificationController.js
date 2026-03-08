const notificationService = require('../services/notificationService');
const { successResponse } = require('../utils/response');

class NotificationController {
  async getMyNotifications(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const notifications = await notificationService.getMyNotifications(req.user.id, limit);
      return successResponse(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.user.id);
      return successResponse(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async broadcastNotification(req, res, next) {
    try {
      const result = await notificationService.broadcastNotification(req.body);
      return successResponse(res, result, `Notification sent to ${result.count} users`, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
