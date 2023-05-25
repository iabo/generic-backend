const Router = require('@koa/router');
const Joi = require('#utils/JoiExtended');
const JWTAuthenticationMiddleware = require('#api/middlewares/JWTAuthentication.middleware');
const validateInput = require('#api/middlewares/validateInput.middleware');
const controller = require('./auth.controller');
const { EMAIL_REGEX } = require('#utils/constants');

const router = new Router();

router.post(
  '/login',
  validateInput({
    body: {
      email: Joi.string().trim().email().sanitize().required(),
      password: Joi.string().trim().sanitize().required(),
    },
  }),
  controller.postLogin,
);

router.post(
  '/login/verify',
  validateInput({
    body: {
      email: Joi.string().trim().email().sanitize().required(),
      code: Joi.string().trim().sanitize().required(),
    },
  }),
  controller.postVerify,
);

router.post(
  '/signup',
  validateInput({
    body: {
      email: Joi.string()
        .trim()
        .email()
        .regex(EMAIL_REGEX)
        .sanitize()
        .required()
        .error(new Error('email invalid')),
      password: Joi.string().trim().sanitize().required(),
      first_name: Joi.string().trim().max(255).sanitize().required(),
      last_name: Joi.string().trim().max(255).sanitize().required(),
      recaptcha: Joi.string().trim().sanitize().required(),
      source: Joi.string().allow(null).trim().max(64).sanitize(),
    },
  }),
  JWTAuthenticationMiddleware,
  controller.postSignup,
);

router.post('/refresh', controller.refreshToken);

router.get('/user', JWTAuthenticationMiddleware, controller.getUser);

router.post(
  '/activation',
  validateInput({
    body: {
      email: Joi.string().trim().email().sanitize().required(),
      code: Joi.string().trim().sanitize().required(),
    },
  }),
  controller.postActivateEmail,
);

router.post(
  '/activation/send',
  validateInput({
    body: {
      email: Joi.string().trim().email().required(),
    },
  }),
  controller.postSendActivationCode,
);

router.post(
  '/reset',
  validateInput({
    body: {
      email: Joi.string().trim().email().required(),
    },
  }),
  controller.postSendResetLink,
);

router.post(
  '/changePassword',
  validateInput({
    body: {
      email: Joi.string().trim().email().required(),
      password: Joi.string().trim().sanitize().required(),
      code: Joi.string().trim().sanitize().required(),
    },
  }),
  controller.postResetPassword,
);

router.post(
  '/acceptInvite',
  validateInput({
    body: {
      firstName: Joi.string().trim().max(255).sanitize().required(),
      lastName: Joi.string().trim().max(255).sanitize().required(),
      password: Joi.string().trim().sanitize().required(),
      code: Joi.string().trim().sanitize().required(),
    },
  }),
  controller.postAcceptInvite,
);

// router.post(
//   '/resend-code',
//   validateInput({
//     body: {
//       email: Joi.string()
//         .trim()
//         .email()
//         .regex(EMAIL_REGEX)
//         .required()
//         .error(new Error('email invalid')),
//     },
//   }),
//   controller.resendCode,
// );

router.post(
  '/sendDailyReport',
  // validateInput({
  //   body: {
  //     email: Joi.string()
  //       .trim()
  //       .email()
  //       .regex(EMAIL_REGEX)
  //       .required()
  //       .error(new Error('email invalid')),
  //   },
  // }),
  controller.sendDailyReport,
);

module.exports = router;
