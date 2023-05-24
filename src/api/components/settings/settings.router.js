const Router = require('@koa/router');
const controller = require('./settings.controller');

const router = new Router();

router.get('/', controller.getSettings);

module.exports = router;
