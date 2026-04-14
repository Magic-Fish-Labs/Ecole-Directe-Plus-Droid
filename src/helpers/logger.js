const { createLogger, format, transports } = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");
const moment = require("moment");

const customTimestampFormat = format((info, opts) => {
    info.timestamp = moment().format("YYYY-MM-DD_HH-mm-ss");
    return info;
});

// Allow overriding the log level via environment variable, default to 'debug' when not in production
const defaultLevel =
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "info" : "debug");

const logger = createLogger({
    level: defaultLevel,
    format: format.combine(customTimestampFormat(), format.json()),
    transports: [
        new transports.Console(),
        new transports.File({ filename: "combined.log" }),
    ],
});

module.exports = logger;
