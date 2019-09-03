var pm2 = require('pm2');
var logger = require("./logger");

var instances = process.env.NUM_THREADS || -1;
var maxMemory = process.env.WEB_MEMORY || 512;

pm2.connect(function() {
    pm2.start({
        script    : 'bin/www',
        name      : 'MCV Theses',
        exec_mode : 'cluster',
        instances : instances,
        max_memory_restart : maxMemory + 'M',   // Auto-restart if process takes more than XXmo
    }, function(err) {
        if (err) return console.error('Error while launching applications', err.stack || err);
        //console.log('PM2 and application has been succesfully started');
        logger.log('info','PM2 and application has been succesfully started');

        // Display logs in standard output
        pm2.launchBus(function(err, bus) {
            //console.log('[PM2] Log streaming started');
            logger.log('info', '[PM2] Log streaming started');

            bus.on('log:out', function(packet) {
                logger.log('info', `[${packet.process.name}] ${packet.data}`);
            });

            bus.on('log:err', function(packet) {
                logger.log('error', `${packet.process.name}][Err] ${packet.data}`);
            });
    });
  });
});
