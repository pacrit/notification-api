const redis = require('redis');
const config = require('./env');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
  try {
    client = redis.createClient({ url: config.redis.url });
    
    client.on('error', (err) => logger.error('Redis Error:', err));
    client.on('connect', () => logger.info('Redis conectado'));
    
    await client.connect();
    return client;
  } catch (error) {
    logger.error('Erro ao conectar no Redis:', error);
    // Não mata a aplicação se Redis falhar, continua sem cache
    return null;
  }
}

function getRedisClient() {
  return client;
}

module.exports = { connectRedis, getRedisClient };