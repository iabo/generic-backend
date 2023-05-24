const http = require('node:http');
const App = require('./app');
const logger = require('#services/logger');

// Getting environment variables
const HOST = process.env.SERVICE_HOST || '0.0.0.0';
const PORT = process.env.SERVICE_PORT || 3000;

// Server
const httpServer = http.createServer(App.callback());

function listenAsync(port, host) {
  return new Promise(function asyncResolve(resolve) {
    httpServer.listen(port, host, function callback() {
      return resolve();
    });
  });
}

// Listen
listenAsync(PORT, HOST)
  .then(() => {
    logger.info('%s Backend service running at http://%s:%d', '🚀', HOST, PORT);
    logger.info('  CTRL-C to end the process\n');
  })
  .catch(error => {
    logger.error(error, 'There was a problem starting the http server');
  });
