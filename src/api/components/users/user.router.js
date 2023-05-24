const Router = require('@koa/router');
const Joi = require('#utils/JoiExtended');
const PhoneJoi = Joi.extend(require('joi-phone-number'));
const JWTAuthenticationMiddleware = require('#api/middlewares/JWTAuthentication.middleware');
const validateInput = require('#api/middlewares/validateInput.middleware');
const adminOnlyMiddleware = require('#api/middlewares/adminOnly.middleware');

const controller = require('./users.controller');
const {
  checkPhoneNumber,
  checkEmail,
  checkUserBelogsToBusiness,
  getUserToEdit,
  checkMainAdmin,
} = require('./user.middleware');

const yabo = 3;
const router = new Router();

router.use(JWTAuthenticationMiddleware);

router.post(
  '/request/verify/number',
  validateInput({
    body: {
      phoneNumber: PhoneJoi.string()
        .phoneNumber({ defaultCountry: 'US', format: 'e164' })
        .required(),
    },
  }),
  controller.submitPhoneNumber,
);

router.post(
  '/verify/number',
  validateInput({
    body: {
      code: Joi.string().trim().sanitize().required(),
    },
  }),
  controller.verifyPhoneCode,
);

router.post(
  '/exists/phone',
  validateInput({
    body: {
      phoneNumber: PhoneJoi.string()
        .phoneNumber({ defaultCountry: 'US', format: 'e164' })
        .required(),
    },
  }),
  controller.getPhoneNumber,
);

router.get(
  '/',
  validateInput({
    query: {
      search: Joi.string().trim().sanitize().default(''),
      limit: Joi.number().integer().positive().max(100).default(10),
      page: Joi.number().integer().positive().allow(0).default(0),
      order: Joi.string().trim().valid('ASC', 'DESC').default('ASC'),
    },
  }),
  adminOnlyMiddleware,
  controller.getUsers,
);

router.post(
  '/',
  adminOnlyMiddleware,
  validateInput({
    body: {
      firstName: Joi.string().max(255).sanitize().required(),
      lastName: Joi.string().max(255).sanitize().required(),
      email: Joi.string().email().required(),
    },
  }),
  checkPhoneNumber,
  checkEmail,
  controller.postUsers,
  controller.getUser,
);

router.patch(
  '/:id',
  adminOnlyMiddleware,
  validateInput({
    body: {
      firstName: Joi.string().max(255).sanitize().optional(),
      lastName: Joi.string().max(255).sanitize().optional(),
      jobTitle: Joi.string().max(255).allow('').sanitize().optional(),
      department: Joi.string().max(255).allow('').sanitize().optional(),
      phoneNumber: PhoneJoi.string()
        .phoneNumber({ defaultCountry: 'US', format: 'e164' })
        .optional(),
    },
  }),
  controller.patchUser,
  controller.getUser,
);

router.get(
  '/:email',
  validateInput({
    params: {
      email: Joi.string().trim().email(),
    },
  }),
  adminOnlyMiddleware,
  controller.getUserByEmail,
);

router.get('/meta/pre-kyc', controller.getPreKYCStatus);

router.post('/meta/pre-kyc', controller.savePreKYCStatus);

router.get('/meta/post-kyb', controller.getPostKYBStatus);

router.post('/meta/post-kyb', controller.savePostKYBStatus);

router.patch(
  '/:id/deactivate',
  adminOnlyMiddleware,
  checkMainAdmin,
  getUserToEdit,
  controller.deactivateUser,
  controller.getUser,
);

module.exports = router;
