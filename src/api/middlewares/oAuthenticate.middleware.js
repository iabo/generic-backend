const { of } = require('await-of');
const { Request, Response } = require('oauth2-server');
const oAuth2 = require('#services/oAuth2');

module.exports = function authenticateHandler(options = {}) {
  return async function middleware(ctx, next) {
    const { request: req, response: res } = ctx;
    const request = new Request(req);
    const response = new Response(res);
    const [token, error] = await of(oAuth2.authenticate(request, response, options));
    if (error) {
      // Verification error
      return ctx.forbidden({
        type: 'Auth/AuthenticateError',
        message: error.message,
      });
    }
    ctx.state.oAuth = { token };
    return next();
  };
};
