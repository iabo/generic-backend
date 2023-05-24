module.exports = async function adminOnly(ctx, next) {
  const { user } = ctx.state;
  if (!user.is_admin) {
  return ctx.forbidden({
    type: 'Resource/NotAvailable',
    message: 'This resource is only available for administrators.',
  });
  }
  return next();
};
