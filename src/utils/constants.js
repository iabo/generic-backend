const USER_ROLES = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

const EMAIL_REGEX = new RegExp(
  /@(?!hotmail|aol|live|outlook|gmail|yahoo|gmailer|ayahoo|onetel|protonmail|icloud)(([a-zA-Z\d-]+\.)+)/i,
);

// Whether we're in production or development
const ENVIRONMENT = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
};

module.exports = {
  USER_ROLES,
  ENVIRONMENT,
  EMAIL_REGEX,
};
