const Joi = require('joi');

const createNotificationSchema = Joi.object({
  title: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.empty': 'Título é obrigatório',
      'string.max': 'Título deve ter no máximo 200 caracteres'
    }),
  message: Joi.string()
    .max(1000)
    .required()
    .messages({
      'string.empty': 'Mensagem é obrigatória',
      'string.max': 'Mensagem deve ter no máximo 1000 caracteres'
    }),
  type: Joi.string()
    .valid('info', 'warning', 'success', 'error')
    .default('info')
    .messages({
      'any.only': 'Tipo deve ser: info, warning, success ou error'
    }),
  metadata: Joi.object().default({})
});

const listNotificationsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20),
  isRead: Joi.boolean().optional()
});

module.exports = {
  createNotificationSchema,
  listNotificationsSchema
};