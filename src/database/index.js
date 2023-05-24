const Knex = require('knex').default;
const { Model } = require('objection');
const { ENVIRONMENT } = require('#utils/constants');
const logger = require('#services/logger');

const { NODE_ENV = 'development' } = process.env;

logger.debug('Creating database connection...');

const knex = Knex({
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_TCP_PORT) || 3306,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    timezone: '+00:00',
  },
  pool: { min: 0, max: 10 },
  debug: process.env.DEBUG_KNEX === 'false',
});

if (NODE_ENV === ENVIRONMENT.DEVELOPMENT) {
  knex.on('query', message => logger.debug(`[QUERY] ${message.sql}`));
}

// Knex instance to objection
Model.knex(knex);

logger.debug('Connection to database...');
knex
  .select(knex.raw('1+1'))
  .then(() => {
    logger.debug('Successfully connected to database.');
  })
  .catch(error => {
    logger.debug('Error on connecting to database.', error);
    process.nextTick(() => {
      process.exit(1);
    });
  });

module.exports = knex;
