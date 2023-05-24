const Mailchimp = require('@mailchimp/mailchimp_transactional');
const logger = require('#services/logger');

const { MANDRILL_API_KEY: API_KEY, MANDRILL_ENABLED } = process.env;
let mailchimp;

if (MANDRILL_ENABLED === 'true') {
  logger.info('🐵 Mandrill API is enabled');
  mailchimp = Mailchimp(API_KEY);
} else {
  logger.info('🐒 Mandrill API is disabled');
  mailchimp = Mailchimp();
}

module.exports = mailchimp;
