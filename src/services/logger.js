const pino = require('pino');
const pinoPretty = require('pino-pretty');

const { LOG_LEVEL = 'info' } = process.env;
const PINO_LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const pinoOptions = {
  level: LOG_LEVEL,
  formatters: {
    bindings() {
      return null;
    },
  },
};
const pinoStream = pinoPretty({
  colorize: true,
  minimumLevel: PINO_LOG_LEVELS[LOG_LEVEL],
  translateTime: 'dd/mm/yyyy hh:MM:ss TT',
});

module.exports = pino(pinoOptions, pinoStream);
