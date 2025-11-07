const express = require('express');
const authRoutes = require('./auth');
const notificationRoutes = require('./notifications');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
