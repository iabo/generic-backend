const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const Mailchimp = require('#email');
const UserMetadata = require('#database/models/UserMetadata');

const emailContent = Handlebars.compile(
  readFileSync(`${__dirname}/templates/resetPassword.html`).toString(),
);

const { MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;
const loginURL = `${process.env.FRONTEND_URL}/login`;
const resetPasswordURL = `${process.env.FRONTEND_URL}/newpassword`;

module.exports = async function sendResetPasswordEmail(user) {
  // Generate a new code
  const code = Math.floor(Math.random() * 10 ** 6)
    .toString()
    .padStart(6, '0');
  await UserMetadata.query().insert({
    id_user: user.id,
    property: `RESET_PASSWORD_${code}`,
    value: code,
  });
  // Send
  const realResetUrl = `${resetPasswordURL}?value=${code}&email=${encodeURIComponent(
    user.email,
  )}`;
  await Mailchimp.messages.send({
    message: {
      from_name: MAIL_FROM_NAME,
      from_email: MAIL_FROM_EMAIL,
      to: [
        {
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
        },
      ],
      subject: 'Reset password',
      html: emailContent({
        firstName: user.first_name,
        code,
        loginURL,
        resetPassword: realResetUrl,
        email: user.email,
      }),
      text: 'Reset your account password',
    },
    async: false,
  });
};
