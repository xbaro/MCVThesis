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
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            res.render('thesis', { page_name: 'thesis', user : req.user });
        }
    }
});

router.get('/user_data', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            Model.User.findOne({attributes: ['username', 'name', 'organization', 'surname', 'email', 'webpage', 'teacher', 'admin', 'roles', 'keywords', 'full_name'],
                where: {username: req.user.username}})
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })
        }
    }
});

router.get('/authored', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            Model.Thesis.findAll({ where: {author: req.user.username} })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

router.get('/advised', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            Model.Thesis.findAll({ where: {author: req.user.username} })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

router.get('/students', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            res.render('thesis', { page_name: 'thesis', user : req.user });
        }
    }
});

router.get('/teachers', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            res.render('thesis', { page_name: 'thesis', user : req.user });
        }
    }
});

router.post('/:thesisID/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            Model.Thesis.findAll({ where: {author: req.user.username} })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

router.post('/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            Model.Thesis.findAll({ where: {author: req.user.username} })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});


module.exports = router;