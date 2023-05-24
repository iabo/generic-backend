const Redis = require('ioredis');
const logger = require('#services/logger');

const {
  REDIS_HOST = '127.0.0.1',
  REDIS_PORT = 6379,
  REDIS_PREFIX = 'RDS_',
} = process.env;

const redis = new Redis(+REDIS_PORT, REDIS_HOST, {
  keyPrefix: REDIS_PREFIX,
});

redis.get('test-key').catch(error => {
  logger.error(error, 'Error on connecting to Redis.');
  process.nextTick(() => {
    process.exit(1);
  });
});

module.exports = redis;
