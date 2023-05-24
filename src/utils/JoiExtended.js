const Joi = require('joi');
const sanitizeHtml = require('sanitize-html');

const sanitize = joi => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.escapeHTML': '{{#label}} must not include HTML!',
  },
  rules: {
    sanitize: {
      validate(value) {
        return sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });
      },
    },
  },
});

const toNumber = joi => ({
  type: 'string',
  base: joi.string(),
  rules: {
    toNumber: {
      validate(value) {
        return Number(value);
      },
    },
  },
});

const toArray = joi => ({
  type: 'array',
  base: joi.array(),
  coerce: {
    from: 'string',
    method(value) {
      return value ? { value: value.split(',') } : { value: [] };
    },
  },
});

const JoiExtended = Joi.extend(sanitize, toNumber, toArray);

module.exports = JoiExtended;
