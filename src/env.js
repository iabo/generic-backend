const { normalize } = require('path');
const dotEnv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const globalEnv = dotEnv.config({
  path: normalize(`${__dirname}/../.env`),
});
dotenvExpand.expand(globalEnv);
