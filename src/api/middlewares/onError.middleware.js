module.exports = async function onError(ctx, next) {
  try {
  return await next();
  } catch (error) {
  ctx.app.emit('error', error, ctx);
  return ctx.internalServerError({
    type: 'Server/InternalServerError',
    message: 'There was an internal error.',
  });
  }
};
