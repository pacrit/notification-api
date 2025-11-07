const notificationService = require('../services/NotificationService');

class NotificationController {
  async create(req, res, next) {
    try {
      const notification = await notificationService.createNotification(
        req.user._id,
        req.body
      );

      res.status(201).json({
        success: true,
        message: 'Notificação criada com sucesso',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await notificationService.listNotifications(
        req.user._id,
        req.query
      );

      res.json({
        success: true,
        data: result.notifications,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(
        req.params.id,
        req.user._id
      );

      res.json({
        success: true,
        message: 'Notificação marcada como lida',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user._id);

      res.json({
        success: true,
        message: `${result.modifiedCount} notificações marcadas como lidas`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await notificationService.deleteNotification(
        req.params.id,
        req.user._id
      );

      res.json({
        success: true,
        message: 'Notificação removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.user._id);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();