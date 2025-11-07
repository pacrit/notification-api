const NotificationRepository = require('../../../src/repositories/NotificationRepository');
const Notification = require('../../../src/models/Notification');
const mongoose = require('mongoose');

describe('NotificationRepository', () => {
  const userId = new mongoose.Types.ObjectId();

  describe('create', () => {
    it('deve criar uma notificação com sucesso', async () => {
      const data = {
        userId,
        title: 'Teste',
        message: 'Mensagem de teste',
        type: 'info'
      };

      const notification = await NotificationRepository.create(data);

      expect(notification).toBeDefined();
      expect(notification.title).toBe(data.title);
      expect(notification.message).toBe(data.message);
      expect(notification.isRead).toBe(false);
    });
  });

  describe('findPaginated', () => {
    beforeEach(async () => {
      // Cria algumas notificações para teste
      await Notification.create([
        { userId, title: 'N1', message: 'M1', isRead: false },
        { userId, title: 'N2', message: 'M2', isRead: true },
        { userId, title: 'N3', message: 'M3', isRead: false }
      ]);
    });

    it('deve retornar notificações paginadas', async () => {
      const result = await NotificationRepository.findPaginated(userId, {
        page: 1,
        limit: 2
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.pages).toBe(2);
    });

    it('deve filtrar por isRead quando fornecido', async () => {
      const result = await NotificationRepository.findPaginated(userId, {
        page: 1,
        limit: 10,
        isRead: false
      });

      expect(result.notifications).toHaveLength(2);
      expect(result.notifications.every(n => !n.isRead)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida', async () => {
      const notification = await Notification.create({
        userId,
        title: 'Teste',
        message: 'Msg',
        isRead: false
      });

      const updated = await NotificationRepository.markAsRead(
        notification._id,
        userId
      );

      expect(updated.isRead).toBe(true);
      expect(updated.readAt).toBeDefined();
    });

    it('deve retornar null se notificação não existir', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await NotificationRepository.markAsRead(fakeId, userId);

      expect(result).toBeNull();
    });
  });

  describe('countUnread', () => {
    it('deve contar corretamente notificações não lidas', async () => {
      await Notification.create([
        { userId, title: 'N1', message: 'M1', isRead: false },
        { userId, title: 'N2', message: 'M2', isRead: true },
        { userId, title: 'N3', message: 'M3', isRead: false }
      ]);

      const count = await NotificationRepository.countUnread(userId);

      expect(count).toBe(2);
    });
  });
});