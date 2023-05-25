const { of } = require('await-of');
const { v4: uuidv4 } = require('uuid');
const Argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const dayjs = require('dayjs');
const axios = require('axios');
const knex = require('#database');
const User = require('#database/models/User');
const UserMetadata = require('#database/models/UserMetadata');
const OAuthToken = require('#database/models/OAuthToken');
const Keys = require('#keys');
const redis = require('#redis');
const confirmationPasswordChange = require('#email/sendConfirmNewPasswordChange');
const sendChangePasswordEmail = require('#email/sendChangePasswordEmail');
const sendVerificationEmail = require('#email/sendVerificationEmail');
const sendWelcomeEmail = require('#email/sendWelcomeEmail');
const sendDailyReportEmail = require('#email/sendDailyReportEmail');
const logger = require('#services/logger');

const { NODE_ENV } = process.env;

const verifyAsync = promisify(jwt.verify);

async function postLogin(ctx) {
  const { email, password } = ctx.request.body;
  const user = await User.query().where({ email }).first();
  if (!user || (user && !user.password)) {
    return ctx.notFound({
      type: 'Auth/BadEmailOrPassword',
      message: 'The user email or password is incorrect.',
    });
  }

  const passwordValid = await user.verifyPassword(password);
  if (!passwordValid) {
    return ctx.notFound({
      type: 'Auth/BadEmailOrPassword',
      message: 'The user email or password is incorrect.',
    });
  }

  if (user.is_disabled) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDisabled',
      message: 'This account is disabled.',
    });
  }
  if (user.is_deleted) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDeleted',
      message: 'This account is deleted.',
    });
  }

  const [, errEmail] = await of(sendVerificationEmail(user));
  if (errEmail) {
    ctx.app.emit('error', errEmail, ctx);
  }

  return ctx.ok({ success: true });
}

async function postVerify(ctx) {
  const { email, code } = ctx.request.body;
  const user = await User.query().where('email', email).first();

  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }

  if (user.is_disabled) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDisabled',
      message: 'This account is disabled',
    });
  }
  if (user.is_deleted) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDeleted',
      message: 'This account is deleted',
    });
  }

  if (NODE_ENV === 'development' && code === '123456') {
    // Do nothing
  } else {
    const metadataCode = await UserMetadata.query()
      .where({
        id_user: user.id,
        property: `VERIFY_EMAIL_${code}`,
      })
      .first();
    if (!metadataCode) {
      return ctx.notFound({
        type: 'Auth/ClientCodeNotFound',
        message:
          'No activation code was found in the database, please request a new one.',
      });
    }
  }
  await UserMetadata.query()
    .delete()
    .where('id_user', user.id)
    .where('property', 'like', 'VERIFY_EMAIL_%');

  const accessToken = uuidv4();
  const newRefreshToken = uuidv4();
  const token = jwt.sign(
    {
      id: user.id,
      is_admin: user.is_admin,
      id_role: user.id_role,
      refreshToken: newRefreshToken,
      type: 'normal',
    },
    Keys.private,
    {
      expiresIn: '1day',
      algorithm: 'RS256',
    },
  );
  await OAuthToken.query().insert({
    id_user: user.id,
    type: 'jwt',
    access_token: accessToken,
    access_token_expires_on: new Date(),
    refresh_token: newRefreshToken,
    refresh_token_expires_on: new Date(),
  });

  return ctx.ok({
    token,
    fullName: `${user.full_name}`,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  });
}

async function refreshToken(ctx) {
  const { authorization } = ctx.headers;
  if (!authorization) {
    return ctx.badRequest({
      type: 'Auth/InvalidToken',
      message: 'Token invalid',
    });
  }
  const [, token] = authorization.split(' ');
  if (!token) {
    return ctx.badRequest({
      type: 'Auth/NoTokenSend',
      message: 'You didnt send a token.',
    });
  }
  const [decode, err] = await of(
    verifyAsync(token, Keys.public, {
      ignoreExpiration: true,
      algorithms: ['RS256'],
    }),
  );
  if (err) {
    return ctx.badRequest({
      error: true,
      type: 'Auth/InvalidToken',
      message: 'Token invalid',
    });
  }
  const user = await User.query()
    .findById(decode.id)
    .withGraphFetched('[role]');
  if (!user) {
    return ctx.notFound({
      error: true,
      type: 'Auth/AccountNotFound',
      message: 'This user has been not found.',
    });
  }
  const tokenExists = await OAuthToken.query()
    .where({
      type: 'jwt',
      refresh_token: decode.refreshToken,
    })
    .first();
  if (!tokenExists) {
    return ctx.notFound({
      error: true,
      type: 'Auth/TokenNotFound',
      message: 'This token does not exists.',
    });
  }
  const newToken = jwt.sign(
    {
      id: user.id,
      is_admin: user.is_admin,
      id_role: user.id_role,
      refreshToken: decode.refreshToken,
      type: decode.type,
    },
    Keys.private,
    {
      expiresIn: '1day',
      algorithm: 'RS256',
    },
  );
  return ctx.ok({
    token: newToken,
  });
}

async function postSignup(ctx) {
  const { email, password, recaptcha, source } = ctx.request.body;
  // Check if email exists
  const emailExists = await User.query()
    .where({
      email,
    })
    .first();
  if (emailExists) {
    return ctx.conflict({
      type: 'Auth/SignupEmailExists',
      message: 'This email already exists. Please Log-in',
    });
  }
  const hashPassword = await Argon2.hash(password, {
    type: Argon2.argon2id,
  });
  const verifyRecaptcha = await axios.post(
    'https://www.google.com/recaptcha/api/siteverify',
    {},
    {
      params: {
        secret: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
        response: recaptcha,
      },
    },
  );
  if (!verifyRecaptcha.data.success) {
    return ctx.badRequest({
      type: 'Auth/SignupRecaptchaError',
      message: 'The request is invalid or malformed',
    });
  }
  const copyBody = { ...ctx.request.body };
  delete copyBody.recaptcha;
  delete copyBody.source;

  const user = await User.query().insert({
    ...copyBody,
    password: hashPassword,
    is_admin: true,
  });

  if (source) {
    await UserMetadata.query().insert({
      id_user: user.id,
      property: 'SIGNUP_SOURCE',
      value: source,
    });
  }

  const [, errEmail] = await of(sendWelcomeEmail(user));
  if (errEmail) {
    ctx.app.emit('error', errEmail, ctx);
  }
  return ctx.ok({ success: true });
}

async function postSendActivationCode(ctx) {
  const { email } = ctx.request.body;

  const user = await User.query().where('email', email).first();

  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }

  if (user.is_disabled) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDisabled',
      message: 'This account is disabled',
    });
  }

  if (user.is_verified) {
    return ctx.send(409, {
      type: 'Auth/AccountAlreadyVerified',
      message: 'This account is already verified.',
    });
  }

  let timesMeta = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'activation_email',
    })
    .first();
  if (!timesMeta) {
    timesMeta = await await UserMetadata.query().insert({
      id_user: user.id,
      property: 'activation_email',
      value: '0',
      unique: false,
    });
  } else {
    const timeDiff = dayjs().unix - dayjs(timesMeta.updatedAt).unix();
    if (timeDiff < 60) {
      return ctx.conflict({
        type: 'Auth/RetryTime',
        message:
          'Please, wait at least 60 seconds before you ask another code.',
      });
    }
  }
  const times = parseInt(timesMeta.value, 10);
  if (times > 10) {
    return ctx.conflict({
      type: 'Auth/EmailRetryLimit',
      message:
        'You got into the limit of how many times you can activate a Email.',
    });
  }

  const [, error] = await of(sendWelcomeEmail(user));
  if (error) {
    ctx.app.emit('error', error, ctx);
    return ctx.internalServerError({
      type: 'Auth/EmailSendError',
      message: 'There was an error trying to send the email to you.',
    });
  }
  await timesMeta.$query().patch({
    value: times + 1,
  });

  return ctx.ok({
    success: true,
  });
}

async function postAcceptInvite(ctx) {
  const { code, firstName, lastName, password } = ctx.request.body;
  const hashPassword = await Argon2.hash(password, {
    type: Argon2.argon2id,
  });
  const invitation = await UserMetadata.query()
    .where({
      property: 'INVITATION_CODE',
      value: code,
    })
    .first();
  if (!invitation) {
    return ctx.notFound({
      type: 'Auth/InvitationCodeNotFound',
      message: 'This invitation code has been not found in the system.',
    });
  }
  if (invitation.value !== code) {
    return ctx.notFound({
      type: 'Auth/InvitationCodeNotFound',
      message: 'This invitation code has been not found in the system.',
    });
  }
  const user = await User.query().where({ id: invitation.id_user }).first();
  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }
  const [, error] = await of(
    knex.transaction(async function onTransaction(trx) {
      await user.$query(trx).patch({
        first_name: firstName,
        last_name: lastName,
        password: hashPassword,
        is_verified: 1,
      });
      await invitation.$query(trx).delete();
    }),
  );
  if (error) {
    ctx.app.emit('error', error, ctx);
    return ctx.internalServerError({
      type: 'Auth/AccountUpdateError',
      message: 'There is a problem updating the account',
    });
  }
  await of(sendVerificationEmail(user));
  return ctx.ok({
    ok: true,
  });
}

async function postSendResetLink(ctx) {
  const { email } = ctx.request.body;
  const user = await User.query().where('email', email).first();

  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }

  if (user.is_disabled) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDisabled',
      message: 'This account is disabled',
    });
  }

  const [, errEmail] = await of(sendChangePasswordEmail(user));
  if (errEmail) ctx.app.emit('error', errEmail, ctx);
  return ctx.ok({ success: true });
}

async function postActivateEmail(ctx) {
  const { code, email } = ctx.request.body;

  const user = await User.query()
    .where('email', email)
    .withGraphFetched('[role]')
    .first();

  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }

  if (user.is_disabled) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDisabled',
      message: 'This account is disabled',
    });
  }

  if (user.is_verified) {
    return ctx.send(409, {
      type: 'Auth/AccountAlreadyVerified',
      message: 'This account is already verified.',
    });
  }

  const metadataCode = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: `ACTIVATION_EMAIL_${code}`,
    })
    .first();
  if (!metadataCode) {
    return ctx.notFound({
      type: 'Auth/ClientCodeNotFound',
      message:
        'No activation code was found in the database, please request a new one.',
    });
  }
  await Promise.all([
    user.$query().patch({ is_verified: true }),
    redis.del(`user_${user.id}`),
    UserMetadata.query()
      .delete()
      .where('id_user', user.id)
      .where('property', 'like', 'ACTIVATION_EMAIL_%')
      .orWhere('property', 'activation_email'),
  ]);

  await UserMetadata.query()
    .delete()
    .where('id_user', user.id)
    .where('property', 'like', 'VERIFY_EMAIL_%');

  const accessToken = uuidv4();
  const newRefreshToken = uuidv4();
  const token = jwt.sign(
    {
      id: user.id,
      is_admin: user.is_admin,
      id_role: user.id_role,
      refreshToken: newRefreshToken,
      type: 'normal',
    },
    Keys.private,
    {
      expiresIn: '1day',
      algorithm: 'RS256',
    },
  );
  await OAuthToken.query().insert({
    id_user: user.id,
    type: 'jwt',
    access_token: accessToken,
    access_token_expires_on: new Date(),
    refresh_token: newRefreshToken,
    refresh_token_expires_on: new Date(),
  });
  return ctx.ok({
    token,
    fullName: `${user.first_name} ${user.last_name}`,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
  });
}

async function postResetPassword(ctx) {
  const { password, email, code } = ctx.request.body;
  const user = await User.query().where('email', email).first();

  if (!user) {
    return ctx.notFound({
      type: 'Auth/AccountNotFound',
      message: 'This user does not exists.',
    });
  }

  if (user.is_disabled) {
    return ctx.badRequest({
      type: 'Auth/AccountIsDisabled',
      message: 'This account is disabled',
    });
  }

  const metadataCode = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: `RESET_PASSWORD_${code}`,
    })
    .first();
  if (!metadataCode) {
    return ctx.notFound({
      type: 'Auth/ClientCodeNotFound',
      message:
        'No activation code was found in the database, please request a new one.',
    });
  }

  const hashPassword = await Argon2.hash(password, {
    type: Argon2.argon2id,
  });

  await Promise.all([
    user.$query().patch({ password: hashPassword }),
    UserMetadata.query()
      .delete()
      .where('id_user', user.id)
      .where('property', 'like', 'RESET_PASSWORD_%'),
    confirmationPasswordChange(user),
  ]);

  return ctx.ok({
    success: true,
  });
}

async function getUser(ctx) {
  //const { user } = ctx.state;
  const userInfo = { ...ctx.state.user };
  // Delete password
  delete userInfo.password;
  //

  ctx.ok(userInfo);
}

async function resendCode(ctx) {
  const { email } = ctx.request.body;
  // Check if user exists
  const user = await User.query().findOne('email', email);
  if (!user) {
    return ctx.notFound({
      type: 'Auth/UserNotFound',
      message: 'This user does not exists.',
    });
  }

  const [, errEmail] = await of(sendWelcomeEmail(user));
  if (errEmail) {
    ctx.app.emit('error', errEmail, ctx);
  }
  return ctx.noContent();
}

async function sendDailyReport(ctx) {

  const { email } = ctx.request.body;
  const user = await User.query().where('email', email).first();
  const [, errEmail] = await of(sendDailyReportEmail(user));
  if (errEmail) ctx.app.emit('error', errEmail, ctx);
  return ctx.ok({ success: 'The Email was sent' });
}

async function success(ctx) {
  logger.info('success');
  logger.info(ctx);
  ctx.ok('dony');
}

async function error(ctx) {
  logger.info('error');
  logger.info(ctx);
  ctx.ok('dony');
}

module.exports = {
  postVerify,
  refreshToken,
  postLogin,
  postSignup,
  getUser,
  postSendActivationCode,
  postSendResetLink,
  postActivateEmail,
  postResetPassword,
  postAcceptInvite,
  sendDailyReport,
  resendCode,
  success,
  error,
};
