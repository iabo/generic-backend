const joi = require('joi');

class ValidateError extends Error {
  constructor(message, prop) {
    super(message);
    this.prop = prop;
    this.message = message;
    this.stack = (new Error()).stack;
  }
}

async function validateType(object = {}, label, schema, options) {
  if (!schema) {
    return {};
  }
  let goodSchema;
  if (joi.isSchema(schema)) {
    goodSchema = schema;
  } else {
    goodSchema = joi.object(schema);
  }
  try {
    const value = await goodSchema.validateAsync(object, options);
    return value;
  } catch (error) {
    throw new ValidateError(error.message, label);
  }
}

/**
 * Validate a schema with Joi and return a middleware for koa.
 * @param {Object} validateObject
 * @param {Object} validateObject.headers Headers
 * @param {Object} validateObject.params Parameters
 * @param {Object} validateObject.query Query params
 * @param {Object} validateObject.body Request body
 * @returns Middleware function.
 */
module.exports = function validate(validateObject, options = {}) {
  return async function onReturn(ctx, next) {
    try {
      if (ctx.headers && validateObject.headers) {
        ctx.headers = await validateType(ctx.headers, 'Headers', validateObject.headers, { ...options, allowUnknown: true });
      }
      if (ctx.params && validateObject.params) {
        ctx.params = await validateType(ctx.params, 'Url Params', validateObject.params, options);
      }
      if (ctx.query && validateObject.query) {
        ctx.query = await validateType(ctx.query, 'Query Params', validateObject.query, { ...options, allowUnknown: true });
      }
      if (ctx.request.body && validateObject.body) {
        ctx.request.body = await validateType(ctx.request.body, 'Request Body', validateObject.body, options);
      }
      return next();
    } catch (error) {
      return ctx.badRequest({
        type: 'Validation/ValidationError',
        in: error.prop,
        message: error.message,
      });
    }
  };
};
