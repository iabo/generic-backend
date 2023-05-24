const Handlebars = require('handlebars');
const { readFileSync } = require('fs');
const UserMetadata = require('#database/models/UserMetadata');
const Mailchimp = require('#email');

const emailContent = Handlebars.compile(
  readFileSync(`${__dirname}/templates/welcome.html`).toString(),
);
const loginURL = `${process.env.FRONTEND_URL}/login`;

const { MAIL_FROM_EMAIL, MAIL_FROM_NAME } = process.env;

module.exports = async function sendWelcomeEmails(user) {
  // Generate a new code
  const code = Math.floor(Math.random() * 10 ** 6)
    .toString()
    .padStart(6, '0');
  // Save Code
  await UserMetadata.query().insert({
    id_user: user.id,
    property: `ACTIVATION_EMAIL_${code}`,
    value: code,
  });
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
      subject: 'Welcome to the app',
      html: emailContent({
        firstName: user.first_name,
        lastName: user.last_name,
        code,
        loginURL,
      }),
      text: `Hi ${user.first_name} ${user.last_name}, Welcome to the app!...`,
    },
    async: false,
  });
};
