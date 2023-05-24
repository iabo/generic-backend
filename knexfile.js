const { normalize } = require('path');
const dotEnv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const globalEnv = dotEnv.config({
  path: normalize(`${__dirname}/.env`),
});
dotenvExpand.expand(globalEnv);

const {
  NODE_ENV = 'development',
  DATABASE_CONNECTION,
  DATABASE_POOL_MIN = 1,
  DATABASE_POOL_MAX = 5,
} = process.env;

const connectionSetting = DATABASE_CONNECTION || {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_TCP_PORT, 10) || 3306,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

module.exports = {
  [NODE_ENV]: {
    client: 'mysql2',
    connection: connectionSetting,
    pool: {
      min: parseInt(DATABASE_POOL_MIN, 10),
      max: parseInt(DATABASE_POOL_MAX, 10),
    },
    migrations: {
      directory: `${__dirname}/src/database/migrations`,
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: `${__dirname}/src/database/seeds`,
      tableName: 'knex_seeds',
    },
  },
};
