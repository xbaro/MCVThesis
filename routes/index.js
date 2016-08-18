var express = require('express');
var router = express.Router();
var Model = require('../models');


function get_host_http(req) {
    var port = req.app.get('port')
    var host = req.headers.host;

    var host_parts = host.split(':');

    if (host_parts.length > 1) {
        host = host_parts[0];
    }

    if (port == 80) {
        return host;
    }

    return host + ':' + port;
}

function get_host_https(req) {
    var port = req.app.get('port-ssl')
    var host = req.headers.host;

    var host_parts = host.split(':');

    if (host_parts.length > 1) {
        host = host_parts[0];
    }

    if (port == 443) {
        return host;
    }

    return host + ':' + port;
}


/* GET home page. */
router.get('/', function (req, res) {
    if (req.secure) {
        // request was via https, so redirect to http
        res.redirect('http://' + get_host_http(req) + req.originalUrl);
    } else {
        res.render('index', { page_name: 'index', user : req.user });
    }    
});

/* GET configuration */
router.get('/config', function (req, res) {
    Model.Config.findAll().then(function(data) {
        if(data) {
            if (data.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data[0]));
            } else {
                Model.Config.create().then(function (data) {
                    if (data) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(data));
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({}));
                    }
                });
            }
        }
    });
});


module.exports = router;