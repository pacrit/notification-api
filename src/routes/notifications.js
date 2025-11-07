const express = require('express');
const notificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middlewares/auth');
const { validate, validateQuery } = require('../middlewares/validate');
const {
  createNotificationSchema,
  listNotificationsSchema
} = require('../validators/notificationValidators');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

router.post(
  '/',
  validate(createNotificationSchema),
  notificationController.create
);

router.get(
  '/',
  validateQuery(listNotificationsSchema),
  notificationController.list
);

router.get('/unread-count', notificationController.getUnreadCount);

router.patch('/read-all', notificationController.markAllAsRead);

router.patch('/:id/read', notificationController.markAsRead);

router.delete('/:id', notificationController.delete);

module.exports = router;