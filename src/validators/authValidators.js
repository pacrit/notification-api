const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter no mínimo 2 caracteres',
      'string.max': 'Nome deve ter no máximo 100 caracteres'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email é obrigatório',
      'string.email': 'Email inválido'
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória',
      'string.min': 'Senha deve ter no mínimo 6 caracteres'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.empty': 'Email é obrigatório',
      'string.email': 'Email inválido'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Senha é obrigatória'
    })
});

module.exports = {
  registerSchema,
  loginSchema
};