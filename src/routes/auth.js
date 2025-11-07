const express = require('express');
const authController = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/authValidators');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;