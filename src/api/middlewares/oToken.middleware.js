const { of } = require('await-of');
const { Request, Response } = require('oauth2-server');
const oAuth2 = require('#services/oAuth2');

module.exports = function tokenHandler(options = {}) {
  return async function middleware(ctx) {
    const { request: req, response: res } = ctx;
    const request = new Request(req);
    const response = new Response(res);
    const [token, error] = await of(oAuth2.token(request, response, options));
    if (error) {
      // Verification error
      return ctx.forbidden({
        type: 'Auth/TokenError',
        message: error.message,
      });
    }
    return ctx.ok(token);
  };
};
