const { resolve } = require('path');
const { readFile } = require('fs/promises');

const { of } = require('await-of');
const redlock = require('#redis/redlock');
const redis = require('#redis');
const logger = require('#services/logger');

let PRIVATE_KEY;
let PUBLIC_KEY;

const exporter = {
  get private() {
    return PRIVATE_KEY;
  },
  get public() {
    return PUBLIC_KEY;
  },
};

async function setUp() {
  logger.debug('Getting private and public key...');
  const [privateKey, publicKey] = await Promise.all([
    redis.get('private_key'),
    redis.get('public_key'),
  ]);
  if (privateKey && publicKey) {
    PRIVATE_KEY = privateKey;
    PUBLIC_KEY = publicKey;
    return;
  }
  const [lock, error] = await of(redlock.acquire('upsertkey_lock', 60000));
  if (error) {
    // Retry again in 10 secs.
    logger.debug('Retrying setup in 10 seconds...');
    setTimeout(setUp, 10000);
    return;
  }
  // Read keys:
  const AuthPrivateKey = await readFile(resolve(__dirname, './JWT_RS256.key'));
  const AuthPublicKey = await readFile(
    resolve(__dirname, './JWT_RS256.key.pub'),
  );

  await Promise.all([
    redis.set('private_key', AuthPrivateKey),
    redis.set('public_key', AuthPublicKey),
  ]);
  PRIVATE_KEY = AuthPrivateKey;
  PUBLIC_KEY = AuthPublicKey;
  logger.debug('Setup public and private key!');
  await lock.unlock();
}

setUp();

module.exports = exporter;
