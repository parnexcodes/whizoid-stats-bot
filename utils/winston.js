const { createLogger, format, transports } = require('winston');
const { combine, label, printf } = format;

const myFormat = printf(({ level, message, label }) => {
  return `[${label}] ${level}: ${message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: 'LOG' }),
    format.colorize(),
    myFormat,
  ),
  transports: [new transports.Console()]
});

module.exports = logger;
