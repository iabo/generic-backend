const { of } = require('await-of');
const { Request, Response } = require('oauth2-server');
const oAuth2 = require('#services/oAuth2');

module.exports = function authorizeHandler(options = {}) {
  return async function middleware(ctx) {
    const { request: req, response: res } = ctx;
    const request = new Request(req);
    const response = new Response(res);
    const [code, error] = await of(oAuth2.authorize(request, response, options));
    if (error) {
      // Verification error
      return ctx.forbidden({
        type: 'Auth/AuthorizeError',
        message: 'You dont have access to this resource',
      });
    }
    ctx.state.oAuth = { code };
    return ctx.ok(code);
    // return next();
  };
};
