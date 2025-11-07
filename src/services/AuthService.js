const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/UserRepository');
const ApiError = require('../utils/ApiError');
const config = require('../config/env');

class AuthService {
  async register({ name, email, password }) {
    const userExists = await userRepository.existsByEmail(email);
    
    if (userExists) {
      throw ApiError.badRequest('Email já cadastrado');
    }

    const user = await userRepository.create({ name, email, password });
    
    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw ApiError.unauthorized('Credenciais inválidas');
    }

    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Credenciais inválidas');
    }

    const token = this.generateToken(user._id);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      },
      token
    };
  }

  generateToken(userId) {
    return jwt.sign({ userId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw ApiError.unauthorized('Token inválido ou expirado');
    }
  }
}

module.exports = new AuthService();