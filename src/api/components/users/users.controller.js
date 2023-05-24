const { of } = require('await-of');
const UserMetadata = require('#database/models/UserMetadata');
const User = require('#database/models/User');
const dayjs = require('#utils/dayjs');
const knex = require('#database');
const redis = require('#redis');
// const PhoneNumber = require('#database/models/PhoneNumbers');
const sendWelcome = require('#email/sendWelcomeEmail');
const { USER_ROLES } = require('#utils/constants');

const { TWILIO_PHONE_NUMBER, NODE_ENV = 'development' } = process.env;

async function submitPhoneNumber(ctx) {
  const { user } = ctx.state;
  const { phoneNumber } = ctx.request.body;
  // Check if the user already have phone verified
  const phoneVerified = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'PHONE_NUMBER_VERIFIED',
    })
    .first();
  if (phoneVerified && NODE_ENV === 'production') {
    return ctx.conflict({
      type: 'PhoneVerified',
      message: 'This account has already verified this phone number.',
    });
  }
  // Check if this phone is not in db
  const phoneExists = await User.query()
    .column('id', 'phone_number', 'person_id')
    .findOne({ phone_number: body.phoneNumber });
  if (phoneExists && NODE_ENV === 'production') {
    return ctx.conflict({
      type: 'PhoneAlreadyExists',
      message: 'This phone already exists in the system.',
    });
  }
  // Create the code
  const code = Math.floor(Math.random() * 10 ** 6)
    .toString()
    .padStart(6, '0');

  await UserMetadata.query().insert({
    id_user: user.id,
    property: `VERIFY_PHONE_${code}`,
    value: phoneNumber,
  });
  return ctx.ok({ success: true });
}

async function verifyPhoneCode(ctx) {
  const { user } = ctx.state;
  const { code } = ctx.request.body;
  // Check if the user already have phone verified
  const phoneVerified = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'PHONE_NUMBER_VERIFIED',
    })
    .first();
  if (phoneVerified && NODE_ENV === 'production') {
    return ctx.conflict({
      type: 'KYC/PhoneVerified',
      message: 'This account has already verified this phone number.',
    });
  }
  // Check Metadata
  const codeExists = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: `VERIFY_PHONE_${code}`,
    })
    .first();
  if (!codeExists) {
    return ctx.notFound({
      type: 'KYC/PhoneCodeNotFound',
      message: 'We did not found this code on the database.',
    });
  }
  await Promise.all([
    UserMetadata.query()
      .where('id_user', user.id)
      .where('property', 'like', 'VERIFY_PHONE_%')
      .delete(),
    UserMetadata.query().insert({
      id_user: user.id,
      property: 'PHONE_NUMBER_VERIFIED',
      value: codeExists.value,
    }),
    redis.del(`user_${user.id}`),
  ]);
  return ctx.ok({ success: true });
}

async function getUsers(ctx) {
  const { search, limit, page, order } = ctx.query;
  const { business } = ctx.state;

  const baseQuery = User.query()
    .innerJoin('business_users', 'users.id', 'business_users.id_user')
    .leftJoin('cards', 'users.id', 'cards.id_user')
    .where({
      'business_users.id_business': business.id,
    })
    .groupBy('users.id')
    .page(page, limit)
    .orderBy('users.is_disabled', order)
    .orderBy('users.is_verified', 'DESC')
    .orderBy('users.first_name', order)
    .orderBy('users.last_name', order);

  let usersQuery = baseQuery.clone();
  if (search) {
    usersQuery = usersQuery.clone().whereRaw(`
        CONCAT(users.first_name, ' ', users.last_name) LIKE '%${search}%' 
        OR 
        (business_users.id_business = ${business.id} AND users.email LIKE '%${search}%')
      `);
  }

  const users = await usersQuery
    .clone()
    .select(
      'users.id',
      'users.first_name',
      'users.last_name',
      'users.job_title',
      'users.department',
      'users.phone_number',
      'users.email',
      'users.is_admin',
      'users.id_role',
      'users.is_verified',
      'users.is_disabled',
      'users.is_deleted',
      'users.person_id',
      knex.raw(
        'coalesce(count(if(isCanceled=0 AND isDeactivated=0 AND is_system_deactivated=0, 1, NULL)), 0) as total_cards',
      ),
    );

  return ctx.ok(users);
}

async function getUser(ctx) {
  const { business } = ctx.state;
  const { id } = ctx.params;
  const user = await User.query()
    .findById(id)
    .select(
      'users.id',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.job_title',
      'users.department',
      'users.phone_number',
      'users.is_admin',
      'users.id_role',
      'users.is_verified',
      'users.is_disabled',
      'users.is_deleted',
      'business_users.id_business',
    )
    .withGraphFetched('[role]')
    .innerJoin('business_users', 'users.id', 'business_users.id_user')
    .first();
  if (!user) {
    return ctx.notFound({
      type: 'Users/NotFound',
      message: 'User has been not found in the database.',
    });
  }
  if (user.id_business !== business.id) {
    return ctx.forbidden({
      type: 'Users/Forbidden',
      message: 'You do not have permissions to view this resource.',
    });
  }
  return ctx.ok(user);
}

async function postUsers(ctx, next) {
  const { business } = ctx.state;
  const { body } = ctx.request;

  const [user, userError] = await of(
    knex.transaction(async function onTransaction(trx) {
      const newUser = await User.query(trx).insert({
        email: body.email,
        first_name: body.firstName,
        last_name: body.lastName,
        phone_number: body.phoneNumber,
        is_admin: body.id_role === USER_ROLES.ADMIN,
        id_role: body.id_role,
        department: body.department,
        job_title: body.jobTitle,
      });
      // Create Person in Solid
      // crear el member ligado al negocio
      const ramdomNumber = Math.floor(Math.random() * (50 - 20 + 1) + 20);
      const dateOfBirth = dayjs().subtract(ramdomNumber, 'years').format('YYYY-MM-DD');
      await newUser.$query(trx).patch({
        person_id: member?.person?.id,
      });

      // Save phone number
      await PhoneNumber.query(trx).insert({
        phone_number: newUser.phone_number,
        person_id: member?.person?.id,
        id_user: newUser.id,
        id_business: business.id,
      });
      // Generate code
      const code = Math.floor(Math.random() * 10 ** 6)
        .toString()
        .padStart(6, '0');
      await UserMetadata.query(trx).insert({
        id_user: newUser.id,
        property: 'INVITATION_CODE',
        value: code,
      });
      await of(sendWelcome(newUser, code, newUser.first_name, business.legal_name));
      return newUser;
    }),
  );

  if (userError?.response) {
    return ctx.badRequest({
      type: 'Users/ProviderError',
      message: userError?.response?.data?.sysMessage,
    });
  }
  if (userError) {
    return ctx.internalServerError({
      type: 'User/CreateUser',
      message: 'There was an error trying to create the user',
    });
  }

  ctx.params.id = user.id;
  return next();
}

async function patchUser(ctx, next) {
  const { user, business } = ctx.state;
  const { id } = ctx.params;
  const { body } = ctx.request;
  const userToEdit = await User.query().findById(id);
  if (!userToEdit) {
    return ctx.notFound({
      type: 'Users/NotFound',
      message: 'User has been not found in the database.',
    });
  }
  // Is user deactivate? Restrict it
  if (userToEdit.is_disabled) {
    return ctx.forbidden({
      type: 'Users/Forbidden',
      message: 'Is not allowed to update deactivate users',
    });
  }
  if (userToEdit.id === user.id && !business.business_ar_id) {
    return ctx.forbidden({
      type: 'Users/Forbidden',
      message: 'Is not allowed to update your own account',
    });
  }
  // Is User account holder? Restrict it.
  if (business.main_id_user === userToEdit.id) {
    return ctx.forbidden({
      type: 'Users/Forbidden',
      message: 'You do not have permissions to view this resource.',
    });
  }

  // Creates user on solid (applies to users that don't have a person_id)
  if (!userToEdit.person_id && (body.firstName || body.lastName)) {
    // Create Person in Solid
    const ramdomNumber = Math.floor(Math.random() * (50 - 20 + 1) + 20);
    const dateOfBirth = dayjs().subtract(ramdomNumber, 'years').format('YYYY-MM-DD');

    await userToEdit.$query().patch({
      person_id: member?.person?.id,
      phone_number: body.phoneNumber,
    });

    await PhoneNumber.query().insert({
      phone_number: body.phoneNumber,
      person_id: member?.person?.id,
      id_user: userToEdit.id,
      id_business: business.id,
    });

    await UserMetadata.query().insert({
      id_user: userToEdit.id,
      property: 'PHONE_NUMBER_VERIFIED',
      value: body.phoneNumber,
    });
  }

  // Update user in local database
  await userToEdit.$query().patch({
    ...(body.firstName && { first_name: body.firstName }),
    ...(body.lastName && { last_name: body.lastName }),
    ...(body.id_role && { is_admin: body.id_role === USER_ROLES.ADMIN }),
    ...(body.id_role && { id_role: body.id_role }),
    ...(body.department && { department: body.department }),
    ...(body.jobTitle && { job_title: body.jobTitle }),
  });

  // Return next
  return next();
}

async function getUserByEmail(ctx) {
  const { email } = ctx.params;
  const { business } = ctx.state;

  const user = await User.query()
    .select(
      'users.id',
      'users.first_name',
      'users.last_name',
      'users.email',
      'users.phone_number',
    )
    .innerJoin('business_users', 'users.id', 'business_users.id_user')
    .where({
      'business_users.id_business': business.id,
      'users.email': email,
      'users.is_admin': false,
      'users.is_verified': true,
      'users.is_disabled': false,
      'users.is_deleted': false,
    })
    .first();
  if (!user) {
    return ctx.notFound({
      type: 'User/NotFound',
    });
  }

  return ctx.ok(user);
}

async function getPhoneNumber(ctx) {
  const { phoneNumber } = ctx.request.body;
  const phoneNumberInDB = await PhoneNumber.query().findOne({
    phone_number: phoneNumber,
  });
  if (phoneNumberInDB) {
    return ctx.ok({
      available: false,
    });
  }
  return ctx.ok({
    available: true,
  });
}

async function getPreKYCStatus(ctx) {
  const { user } = ctx.state;

  const hasDonePreKYC = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'HAS_WELCOME_EXPERIENCE_PRE_KYC',
    })
    .first();

  return ctx.ok({
    has_welcome_experience_pre_kyc: !!hasDonePreKYC,
  });
}

async function savePreKYCStatus(ctx) {
  const { user } = ctx.state;

  const hasDonePreKYC = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'HAS_WELCOME_EXPERIENCE_PRE_KYC',
    })
    .first();
  if (!hasDonePreKYC) {
    await UserMetadata.query().insert({
      id_user: user.id,
      property: 'HAS_WELCOME_EXPERIENCE_PRE_KYC',
      value: true,
    });
  }

  return ctx.created({
    success: true,
  });
}

async function getPostKYBStatus(ctx) {
  const { user } = ctx.state;

  const hasDonePostKYB = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'HAS_WELCOME_EXPERIENCE_POST_KYB',
    })
    .first();

  return ctx.ok({
    has_welcome_experience_post_kyb: !!hasDonePostKYB,
  });
}

async function savePostKYBStatus(ctx) {
  const { user } = ctx.state;

  const hasDonePostKYB = await UserMetadata.query()
    .where({
      id_user: user.id,
      property: 'HAS_WELCOME_EXPERIENCE_POST_KYB',
    })
    .first();
  if (!hasDonePostKYB) {
    await UserMetadata.query().insert({
      id_user: user.id,
      property: 'HAS_WELCOME_EXPERIENCE_POST_KYB',
      value: true,
    });
  }

  return ctx.created({
    success: true,
  });
}

async function deactivateUser(ctx, next) {
  const { userToEdit, business } = ctx.state;

  await userToEdit.$query().patch({
    is_disabled: true,
  });

  return next();
}

module.exports = {
  verifyPhoneCode,
  submitPhoneNumber,
  getUsers,
  getUser,
  postUsers,
  patchUser,
  getUserByEmail,
  getPhoneNumber,
  getPreKYCStatus,
  savePreKYCStatus,
  getPostKYBStatus,
  savePostKYBStatus,
  deactivateUser,
};
