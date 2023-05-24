const Router = require('@koa/router');
const onErrorMiddleware = require('../middlewares/onError.middleware');
const AuthRouter = require('./auth/auth.router');
const ControlRouter = require('./control/control.router');
const OAuth2Router = require('./oAuth2/oAuth2.router');
const SettingsRouter = require('./settings/settings.router');
const UserRouter = require('./users/user.router');
const gitHash = require('#utils/gitHash');
const Keys = require('#keys');

const router = new Router();

// Middlewares
router.use(onErrorMiddleware);

// Main Routes
router.get('/', function mainGet(ctx) {
  ctx.ok({
    name: 'Backend',
    version: '1.0.0',
    hash: gitHash,
  });
});
router.get('/publickey', function getPublicKey(ctx) {
  ctx.body = Keys.public.toString();
});

// Component Routes
router.use('/auth', AuthRouter.allowedMethods(), AuthRouter.routes());
router.use('/control', ControlRouter.allowedMethods(), ControlRouter.routes());
// router.use('/oAuth2', OAuth2Router.allowedMethods(), OAuth2Router.routes());
router.use('/settings', SettingsRouter.allowedMethods(), SettingsRouter.routes());
router.use('/users', UserRouter.allowedMethods(), UserRouter.routes());

module.exports = router;
