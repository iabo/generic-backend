const { createMailgunClient } = require('simple-mailgun.js');
const logger = require('#services/logger');

const { MAILGUN_API_KEY, MAILGUN_ENABLED, MAILGUN_DOMAIN } = process.env;
let mailgunClient;

if (MAILGUN_ENABLED === 'true' && MAILGUN_API_KEY) {
  mailgunClient = createMailgunClient({
    domain: MAILGUN_DOMAIN,
    apiKey: MAILGUN_API_KEY,
    debugLogging: true,
  });
  logger.info('🔫 Mailgun API is enabled');
} else {
  logger.info('🚫 No email API defined');
}

module.exports = mailgunClient;
