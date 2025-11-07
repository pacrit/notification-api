const NotificationService = require('../../../src/services/NotificationService');
const notificationRepository = require('../../../src/repositories/NotificationRepository');
const ApiError = require('../../../src/utils/ApiError');
const mongoose = require('mongoose');

jest.mock('../../../src/repositories/NotificationRepository');
jest.mock('../../../src/config/redis', () => ({
  getRedisClient: jest.fn(() => null)
}));

describe('NotificationService', () => {
  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createNotification', () => {
    it('deve criar uma notificação com sucesso', async () => {
      const data = {
        title: 'Nova notificação',
        message: 'Conteúdo da notificação'
      };

      const mockNotification = {
        _id: new mongoose.Types.ObjectId(),
        userId,
        ...data,
        isRead: false
      };

      notificationRepository.create.mockResolvedValue(mockNotification);

      const result = await NotificationService.createNotification(userId, data);

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.create).toHaveBeenCalledWith({
        userId,
        ...data
      });
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      const mockNotification = {
        _id: notificationId,
        userId,
        isRead: true,
        readAt: new Date()
      };

      notificationRepository.markAsRead.mockResolvedValue(mockNotification);

      const result = await NotificationService.markAsRead(notificationId, userId);

      expect(result).toEqual(mockNotification);
      expect(notificationRepository.markAsRead).toHaveBeenCalledWith(
        notificationId,
        userId
      );
    });

    it('deve lançar erro se notificação não for encontrada', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      
      notificationRepository.markAsRead.mockResolvedValue(null);

      await expect(
        NotificationService.markAsRead(notificationId, userId)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteNotification', () => {
    it('deve deletar notificação com sucesso', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      const mockNotification = {
        _id: notificationId,
        userId,
        deletedAt: new Date()
      };

      notificationRepository.softDelete.mockResolvedValue(mockNotification);

      const result = await NotificationService.deleteNotification(
        notificationId,
        userId
      );

      expect(result).toEqual(mockNotification);
    });

    it('deve lançar erro se notificação não existir', async () => {
      const notificationId = new mongoose.Types.ObjectId();
      
      notificationRepository.softDelete.mockResolvedValue(null);

      await expect(
        NotificationService.deleteNotification(notificationId, userId)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getUnreadCount', () => {
    it('deve retornar contagem de não lidas', async () => {
      notificationRepository.countUnread.mockResolvedValue(5);

      const result = await NotificationService.getUnreadCount(userId);

      expect(result.count).toBe(5);
      expect(result.cached).toBe(false);
    });
  });
});