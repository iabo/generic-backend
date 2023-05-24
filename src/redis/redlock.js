const RedLock = require('redlock');
const client = require('./index');

const redlock = new RedLock([client], {
  driftFactor: 0.01,
  retryCount: 0,
  retryDelay: 200,
  retryJitter: 200,
  automaticExtensionThreshold: 500,
});

module.exports = redlock;
