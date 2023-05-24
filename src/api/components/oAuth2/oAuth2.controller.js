const logger = require('#services/logger');

async function googleOauth2Success(ctx) {
  logger.info('success');
  logger.info(ctx);
  ctx.ok('dony');
}

async function googleOauth2Error(ctx) {
  logger.info('error');
  logger.info(ctx);
  ctx.ok('dony');
}

module.exports = {
  googleOauth2Success,
  googleOauth2Error,
};
