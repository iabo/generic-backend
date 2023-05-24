const redis = require('#redis');

const { REDIS_PREFIX = 'RDS_' } = process.env;

async function getControls(ctx) {
  return ctx.ok('control');
}

async function clearAllUserCache(ctx) {
  const users = await redis.keys(`${REDIS_PREFIX}user_*`);
  if (!users?.length) {
    return ctx.ok({ success: true });
  }
  const pipeline = redis.pipeline();
  for (let i = 0; i < users.length; i += 1) {
    const kUser = users[i];
    pipeline.del(kUser.replace(REDIS_PREFIX, ''));
  }
  const result = await pipeline.exec();
  return ctx.ok({ result });
}

module.exports = {
  getControls,
  clearAllUserCache,
};
