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

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            res.render('profile', { page_name: 'profile', user : req.user });
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

module.exports = router;