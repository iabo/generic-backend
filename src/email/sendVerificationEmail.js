const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const UserMetadata = require('#database/models/UserMetadata');
const Mailgun = require('#email');
const logger = require('#services/logger');

const emailContent = Handlebars.compile(
  readFileSync(`${__dirname}/templates/verificationCode.html`).toString(),
);
const { MAILGUN_ENABLED, MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;

const loginURL = `${process.env.FRONTEND_URL}/login`;

module.exports = async function sendVerificationEmail(user) {
  // Generate a new code
  const code = Math.floor(Math.random() * 10 ** 6)
    .toString()
    .padStart(6, '0');
  // Save Code
  await UserMetadata.query().insert({
    id_user: user.id,
    property: `VERIFY_EMAIL_${code}`,
    value: code,
  });

  if (MAILGUN_ENABLED === 'true') {
    const response = await Mailgun.sendMessage({
      from: `${MAIL_FROM_NAME} ${MAIL_FROM_EMAIL}`,
      to: `${user.full_name} ${user.email}`,
      subject: 'Test Code',
      html: emailContent({
        fullName: `${user.full_name}`,
        code,
        loginURL,
      }),
    });
    logger.debug(response);
  } else {
    logger.debug('🚫 No email API defined');
    return;
  }
};
