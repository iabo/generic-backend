const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const UserMetadata = require('#database/models/UserMetadata');
const Mailchimp = require('#email');
const logger = require('#services/logger');

const emailContent = Handlebars.compile(
  readFileSync(`${__dirname}/templates/verificationCode.html`).toString(),
);

const { MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;
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
  // Dont send if api key is empty
  if (Mailchimp.apiKey === '') {
    logger.debug(
      'Email Api key not found. Skipping %s',
      sendVerificationEmail.name,
    );
    return;
  }
  // Send
  const emailResponse = await Mailchimp.messages.send({
    message: {
      from_name: MAIL_FROM_NAME,
      from_email: MAIL_FROM_EMAIL,
      to: [
        {
          email: user.email,
          name: `${user.full_name}`,
        },
      ],
      subject: 'Account Verification',
      html: emailContent({
        fullName: `${user.full_name}`,
        code,
        loginURL,
      }),
      text: `Hi ${user.full_name}, It's seems you're trying to log into your account...`,
    },
    async: false,
  });
  logger.debug(emailResponse);
};
