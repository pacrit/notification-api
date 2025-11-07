class ApiError extends Error {
  constructor(statusCode, message, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg) {
    return new ApiError(400, msg);
  }

  static unauthorized(msg = 'Não autorizado') {
    return new ApiError(401, msg);
  }

  static forbidden(msg = 'Acesso negado') {
    return new ApiError(403, msg);
  }

  static notFound(msg = 'Recurso não encontrado') {
    return new ApiError(404, msg);
  }

  static internal(msg = 'Erro interno do servidor') {
    return new ApiError(500, msg, false);
  }
}

module.exports = ApiError;
