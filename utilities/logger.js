var log4js = require("log4js");
const moment = require("moment-timezone");

const layout = {
  type: "pattern",
  pattern:
    //process.env.LOGGER_FORMAT || process.env.NODE_ENV === "production"
    process.env.LOGGER_FORMAT || "[%x{timestamp}] %c [%p] - %m",
  tokens: {
    timestamp: function (logEvent) {
      return moment()
        .tz(process.env.TZ || "Asia/Calcutta")
        .format();
    },
  },
};

log4js.configure({
  pm2: true,
  appenders: {
    consoleAppender: {
      type: "console",
      layout,
    },

    fileAppender: { type: "file", filename: "application.log", layout },
  },
  categories: {
    default: {
      appenders: ["consoleAppender"],
      level: process.env.APPLOGLEVEL || "debug",
    },
  },
});

var logger = log4js.getLogger(`[${process.env.APP_NAME || "transportTV"}]`);

module.exports = logger;

module.exports.getLogger = (name = "app") => {
  return {
    info: (args) => logger.info(`[${name}]`, args),
    warning: (args) => logger.warning(`[${name}]`, args),
    debug: (args) => logger.debug(`[${name}]`, args),
    error: (args) => logger.error(`[${name}]`, args),
    trace: (args) => logger.trace(`[${name}]`, args),
  };
}; // module.exports
