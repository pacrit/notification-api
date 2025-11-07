const authService = require('../services/AuthService');

class AuthController {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req, res) {
    res.json({
      success: true,
      data: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email
      }
    });
  }
}

module.exports = new AuthController();