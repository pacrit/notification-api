const authService = require('../services/AuthService');
const userRepository = require('../repositories/UserRepository');
const ApiError = require('../utils/ApiError');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw ApiError.unauthorized('Token não fornecido');
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw ApiError.unauthorized('Formato de token inválido');
    }

    const token = parts[1];
    const decoded = authService.verifyToken(token);

    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw ApiError.unauthorized('Usuário não encontrado');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authenticate };