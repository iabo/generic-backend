const Router = require('@koa/router');
const controller = require('./control.controller');

const router = new Router();

router.get('/', controller.getControls);

router.delete('/cache/all/users', controller.clearAllUserCache);

module.exports = router;
