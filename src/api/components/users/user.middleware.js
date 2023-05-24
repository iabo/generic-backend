const User = require('#database/models/User');
// const PhoneNumber = require('#database/models/PhoneNumbers');

const { NODE_ENV = 'development' } = process.env;

async function checkPhoneNumber(ctx, next) {
  const { body } = ctx.request;

  // Search phone number
  const userPhoneNumberExist = await User.query()
    .column('id', 'phone_number', 'person_id')
    .findOne({ phone_number: body.phoneNumber });
  if (userPhoneNumberExist && NODE_ENV === 'production') {
    return ctx.conflict({
      type: 'Users/PhoneNumberExists',
      message: 'This phone number is already occupied. This field must be unique.',
    });
  }

  return next();
}

async function checkEmail(ctx, next) {
  const { body } = ctx.request;

  // Search email
  const emailExists = await User.query().findOne({
    email: body.email,
  });
  if (emailExists) {
    return ctx.conflict({
      type: 'Users/EmailExists',
      message: 'This email address is already occupied. This field must be unique.',
    });
  }

  return next();
}

async function checkMainAdmin(ctx, next) {
  return next();
}

async function getUserToEdit(ctx, next) {
  const { id } = ctx.params;
  const user = await User.query()
    .findById(id)
    .select('users.*', 'business_users.id_user')
    .first();
  if (!user) {
    return ctx.notFound({
      type: 'Users/NotFound',
      message: 'User has not been found in the database.',
    });
  }

  ctx.state.userToEdit = user;
  return next();
}

async function checkUserBelogsToBusiness(ctx, next) {
  const { business, userToEdit } = ctx.state;

  if (userToEdit.id_business !== business.id) {
    return ctx.forbidden({
      type: 'Users/Forbidden',
      message: 'You do not have permissions to view this resource.',
    });
  }

  return next();
}

module.exports = {
  checkPhoneNumber,
  checkEmail,
  checkMainAdmin,
  getUserToEdit,
  checkUserBelogsToBusiness,
};
