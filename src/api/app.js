/* eslint-disable global-require */
const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const KoaLogger = require('koa-logger');
const respond = require('koa-respond');
const helmet = require('koa-helmet');
const serve = require('koa-static');
const cors = require('@koa/cors');
const session = require('koa-session');
const passport = require('koa-passport');
const { join } = require('path');
const logger = require('#services/logger');

const ComponentsRouter = require('./components/router');
const { ENVIRONMENT } = require('#utils/constants');

const app = new Koa();

// Set up session middleware
app.keys = ['my-session-secret'];
app.use(session(app));

// Set up passport middleware
app.use(passport.initialize());
app.use(passport.session());

const { SERVER_PROXY: SERVERPROXY, NODE_ENV = 'development' } = process.env;

if (SERVERPROXY === 'true') {
  logger.debug('App behind proxy: %s', SERVERPROXY);
  app.proxy = true;
} else {
  app.use(
    serve(join(__dirname, '../public'), {
      defer: true,
    }),
  );
}

if (NODE_ENV === ENVIRONMENT.DEVELOPMENT) {
  logger.debug('Node env: %s', NODE_ENV);
  app.use(KoaLogger());
}

app.use(helmet());
app.use(
  respond({
    statusMethods: {
      conflict: 409,
    },
  }),
);

/* Error handling */
app.on('error', (error, ctx) => {
  if (error.response) {
    const { response } = error;
    logger.error(response.data, 'API Error data');
  } else {
    logger.error(error, 'API Error >>');
    logger.error(ctx, 'ctx data >>');
  }
});

/* CORS */
app.use(
  cors({
    allowHeaders: ['Authorization', 'content-type'],
    origin: '*',
  }),
);

app.use(
  BodyParser({
    enableTypes: ['json', 'form'],
    jsonLimit: '5mb',
    strict: true,
    onerror(err, ctx) {
      return ctx.throw(422, {
        type: 'Server/JSONParseError',
        message: 'The body is in bad syntax. Please verify it.',
      });
    },
  }),
);

/* Get router */
app.use(ComponentsRouter.allowedMethods());
app.use(ComponentsRouter.routes());

module.exports = app;
