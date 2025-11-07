const notificationRepository = require('../repositories/NotificationRepository');
const { getRedisClient } = require('../config/redis');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.CACHE_KEY_PREFIX = 'unread_count:';
    this.CACHE_TTL = 300; // 5 minutos
  }

  async createNotification(userId, data) {
    const notification = await notificationRepository.create({
      userId,
      ...data
    });

    // Invalida o cache de contador
    await this.invalidateUnreadCache(userId);

    return notification;
  }

  async listNotifications(userId, options) {
    return notificationRepository.findPaginated(userId, options);
  }

  async markAsRead(notificationId, userId) {
    const notification = await notificationRepository.markAsRead(notificationId, userId);
    
    if (!notification) {
      throw ApiError.notFound('Notificação não encontrada');
    }

    await this.invalidateUnreadCache(userId);

    return notification;
  }

  async markAllAsRead(userId) {
    const result = await notificationRepository.markAllAsRead(userId);
    
    await this.invalidateUnreadCache(userId);

    return { modifiedCount: result.modifiedCount };
  }

  async deleteNotification(notificationId, userId) {
    const notification = await notificationRepository.softDelete(notificationId, userId);
    
    if (!notification) {
      throw ApiError.notFound('Notificação não encontrada');
    }

    if (!notification.isRead) {
      await this.invalidateUnreadCache(userId);
    }

    return notification;
  }

  async getUnreadCount(userId) {
    const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
    const redis = getRedisClient();

    // Tenta buscar do cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached !== null) {
          return { count: parseInt(cached), cached: true };
        }
      } catch (error) {
        logger.warn('Erro ao buscar do Redis:', error.message);
      }
    }

    // Busca do banco
    const count = await notificationRepository.countUnread(userId);

    // Salva no cache
    if (redis) {
      try {
        await redis.setEx(cacheKey, this.CACHE_TTL, count.toString());
      } catch (error) {
        logger.warn('Erro ao salvar no Redis:', error.message);
      }
    }

    return { count, cached: false };
  }

  async invalidateUnreadCache(userId) {
    const redis = getRedisClient();
    if (!redis) return;

    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}${userId}`;
      await redis.del(cacheKey);
    } catch (error) {
      logger.warn('Erro ao invalidar cache:', error.message);
    }
  }
}

module.exports = new NotificationService();