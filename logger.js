var path = require('path');
var winston = require('winston');

//winston.emitErrs = true;

var rfs = require('rotating-file-stream');
var fs=require('fs');

// Log file
var logFolder = path.join(__dirname, 'log');
if (process.env.LOGS_FOLDER) {
    logFolder = process.env.LOGS_FOLDER;
}

// ensure log directory exists
fs.existsSync(logFolder) || fs.mkdirSync(logFolder);
console.log('MCV Theses: Logs stored at folder ' + logFolder);

var file_access = path.join(logFolder, 'mcv.access.log');
var file_error = path.join(logFolder, 'mcv.error.log');

var logger = new winston.createLogger({
    defaultMeta: { service: 'mcv_theses' },
    format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        winston.format.json()
      ),
    transports: [
        new winston.transports.File({
            name: 'info-file',
            level: 'info',
            timestamp:true,
            filename: file_access,
            handleExceptions: true,
            maxsize: process.env.LOG_ROTATE_MAX_BYTES || 16384,
            maxFiles: process.env.LOG_ROTATE_BACKUP_COUNT || 5,
            colorize: false
        }),
        new winston.transports.File({
            name: 'error-file',
            level: 'error',
            filename: file_error,
            handleExceptions: true,
            json: true,
            maxsize: process.env.LOG_ROTATE_MAX_BYTES || 16384,
            maxFiles: process.env.LOG_ROTATE_BACKUP_COUNT || 5,
            colorize: false
        }),
        new winston.transports.Console({
            level: 'warning',
            handleExceptions: true,
            json: false,
            colorize: true
        })
    ],
    exitOnError: false
});

module.exports = logger;
module.exports.stream = {
    write: function(message, encoding){
        logger.info(message);
    }
};

module.exports.exitAfterFlush = function(code) {
    logger.transports['error-file'].on('flush', function() {
        process.exit(code);
    });
};
