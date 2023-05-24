const hash = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString()
  .trim();

module.exports = hash.toString().trim().slice(0, 8);
