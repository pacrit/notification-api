const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const config = require('../config/env');

function errorHandler(err, req, res, next) {
  let error = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    error = new ApiError(400, 'Erro de validação', true);
    error.errors = errors;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error = ApiError.badRequest(`${field} já existe`);
  }

  // Mongoose cast error (ID inválido)
  if (err.name === 'CastError') {
    error = ApiError.badRequest('ID inválido');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Token inválido');
  }

  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token expirado');
  }

  // Se não for erro operacional, loga
  if (!error.isOperational) {
    logger.error('Erro não tratado:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method
    });
  }

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : 'Erro interno do servidor';

  const response = {
    success: false,
    message,
    ...(error.errors && { errors: error.errors })
  };

  // Adiciona stack trace em desenvolvimento
  if (config.nodeEnv === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;