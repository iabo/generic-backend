const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const { of } = require('await-of');
const redis = require('#redis');
const OAuthToken = require('#database/models/OAuthToken');
const User = require('#database/models/User');
const Keys = require('#keys');

const verifyAsync = promisify(jwt.verify);

module.exports = async function JWTAuthentication(ctx, next) {
  if (ctx.request.method === 'OPTIONS') {
    return ctx.send(200, 'OK');
  }
  const { authorization } = ctx.headers;
  if (!authorization) {
    return ctx.badRequest({
      type: 'Auth/NoTokenSent',
      message: 'No Auth Token Found',
    });
  }
  const [, token] = authorization.split(' ');
  if (!token) {
    return ctx.badRequest({
      type: 'Auth/InvalidToken',
      message: 'Token is required',
    });
  }
  const [decode, err] = await of(verifyAsync(token, Keys.public, { algorithms: ['RS256'] }));
  if (err) {
    return ctx.badRequest({
      type: 'Auth/InvalidToken',
      message: 'Invalid token',
    });
  }
  const inCache = await redis.get(`user_${decode.id}`);
  if (inCache) {
    ctx.state.token = decode;
    ctx.state.user = JSON.parse(inCache);
    return next();
  }
  const user = await User.query().findById(decode.id);
  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }
  if (decode.type === 'normal') {
    const tokenExists = await OAuthToken.query().where({
      type: 'jwt',
      refresh_token: decode.refreshToken,
    }).first();
    if (!tokenExists) {
      return ctx.notFound({
        type: 'Auth/TokenNotFound',
        message: 'This token has been not found.',
      });
    }
    if (tokenExists.id_user !== user.id) {
      return ctx.notFound({
        type: 'Auth/TokenNotFound',
        message: 'This token has been not found.',
      });
    }
  }

  ctx.state.user = user;
  ctx.state.token = decode;
  await redis.set(`user_${decode.id}`, JSON.stringify(ctx.state.user), 'EX', 600);
  return next();
};
