const USER_ROLES = {
  USER: 1,
  ADMIN: 2,
  SUPER_ADMIN: 3,
};

// Excluded email domains
const EMAIL_REGEX = new RegExp(
  /@(?!gmailer|ayahoo|onetel|protonmail)(([a-zA-Z\d-]+\.)+)/i,
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
