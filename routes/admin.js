var express = require('express');
var sync = require('synchronize')
var router = express.Router();

var fs = require('fs-extra'),    
    url = require('url'),
    path = require('path');
var Model = require('../models');

/* GET not labeled video. */
router.get('/', function (req, res) {    
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            res.render('admin', { user: req.user});
        }        
    }
});

/* POST key value. */
router.post('/set/:key', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var key = req.params.key;
            var value = req.body.value;
            var confModel = new Model.Config({ key: key, value: value });
            
            var confModelPromise = new Model.Config({ key: key}).fetch();
            return confModelPromise.then(function (model) {
                if (model) {
                    // Update an existing parameter
                   
                    confModel.save().then(function (model) {
                        if (!model) {
                            res.render('error', { message: 'Error modifying key ' + key + ' with value ' + value, error: {} });
                        } else {
                            res.render('admin', { user: req.user, message: "Value changed" });
                        }
                    });                    
                } else {
                    // Create a new register                    
                    confModel.save(null, { method: 'insert' }).then(function (model) {
                        if (!model) {
                            res.render('error', { message: 'Error modifying key ' + key + ' with value ' + value, error: {} });
                        } else {
                            res.render('admin', { user: req.user, message: "Value changed" });
                        }
                    });                    
                }
            });            
        }
    }    
});

/* GET . */
router.post('/resetDB', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var knex = DB.DB.knex;
            knex('tblVideos').del().then(function (numRows) {
                res.render('admin', { user: req.user, message: "Reset performed. " + numRows + " rows deleted." });
            });
        }
    }
});

/* GET . */
router.post('/load', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var videoPathReq = new Model.Config({ key: 'videoPath' }).fetch();                    
            return videoPathReq.then(function (model) {
                if (model) {                    
                    // Add the new videos
                    var videoPath = model.attributes.value;
                    fs.lstat(videoPath, function (err, stats) {
                        if (!err && stats.isDirectory()) {
                            var videos = fs.readdirSync(videoPath);
                            insertVideos(videos);
                            res.render('admin', { user: req.user, message: videos.length + " videos loaded" });
                        } else {
                            res.render('error', { message: 'videoPath configuration value is incorrect', error: {} });
                        }
                        return;
                    });                                     
                } else {
                    res.render('error', { message: 'videoPath configuration value not found', error: {} });
                }
                return;
            });
        }
    }
});

/* GET . */
router.post('/backup', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.attributes.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {} });
        } else {
            var backupPathReq = new Model.Config({ key: 'backupPath' }).fetch();
            return backupPathReq.then(function (model) {
                if (model) {
                    var backupPath = model.attributes.value;
                    try {
                        fs.ensureDirSync(backupPath);
                    } catch (err) {
                        res.render('admin', { user: req.user, message: 'Cannot create backup dir' });
                    }
                    var moment = require('moment');
                    var filename = path.resolve(backupPath, moment().format('YYYYMMDD_HHmmss') + '.sql'); 
                        var mysqlDump = require('mysqldump');                        
                        var dbconfig = DB.Config;                        
                        mysqlDump({
                            host: dbconfig.host,
                            user: dbconfig.user,
                            password: dbconfig.password,
                            database: dbconfig.database,
                            dest: filename
                        }, function (err) {
                            if (err) {
                                res.render('error', { message: err, error: {} });
                            } else {
                                res.render('admin', { user: req.user, message: 'backup file created at ' + filename });
                            }                        
                        })
                    }
                    return;
                });
         }
    }
});

module.exports = router;