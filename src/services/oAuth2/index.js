const OAuthServer = require('oauth2-server');
const model = require('./model');

const oauth = new OAuthServer({
  debug: true,
  model,
});

module.exports = oauth;
