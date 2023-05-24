const { CONTROL_PASSWORD } = process.env;

module.exports = async function control(ctx, next) {
  const { password } = ctx.headers;
  if (!password) {
  return ctx.badRequest({
    type: 'Auth/PasswordNotProvided',
    message: 'Password header is missing',
  });
  }
  if (password !== CONTROL_PASSWORD) {
  return ctx.forbidden({
    type: 'Auth/PasswordError',
    message: 'Wrong password',
  });
  }
  return next();
};
