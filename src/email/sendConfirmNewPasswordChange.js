const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const Mailchimp = require('#email');

const emailContent = Handlebars.compile(
  readFileSync(`${__dirname}/templates/confirmPasswordChange.html`).toString(),
);

const { MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;
const loginURL = `${process.env.FRONTEND_URL}/login`;

module.exports = async function sendResetPasswordEmail(user) {
  // Send
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
      subject: 'Password changed',
      html: emailContent({
        firstName: user.first_name,
        loginURL,
      }),
      text: 'Your account password has change.',
    },
    async: false,
  });
};
