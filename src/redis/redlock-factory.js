const RedLock = require('redlock');
const client = require('./index');

function redlockFactory(retryCount = 3, retryDelay = 200) {
  const redlock = new RedLock([client], {
    driftFactor: 0.01,
    retryCount,
    retryDelay,
    retryJitter: 200,
    automaticExtensionThreshold: 500,
  });
  return redlock;
}

module.exports = redlockFactory;
