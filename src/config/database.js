const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    await mongoose.connect(config.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.info('MongoDB conectado com sucesso');
  } catch (error) {
    logger.error('Erro ao conectar no MongoDB:', error);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB desconectado');
});

module.exports = connectDB;