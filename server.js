const app = require('./src/app');
const connectDB = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const config = require('./src/config/env');
const logger = require('./src/utils/logger');

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    app.listen(config.port, () => {
      logger.info(`Servidor rodando na porta ${config.port}`);
      logger.info(`Ambiente: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();