﻿var express = require('express');
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
        Model.User.findOne({attributes: ['username', 'name', 'organization', 'surname', 'email', 'webpage', 'teacher', 'admin', 'roles', 'keywords', 'full_name'],
            where: {username: req.user.username}})
        .then(function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        })
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
        Model.Thesis.findAll({ where: {author: req.user.username} })
        .then(function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        });
    }
});

router.get('/students', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.query['term']) {
            Model.User.findOne({
                attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                where: {teacher: false, admin: false,
                    $or: [
                        {
                          name: {
                            $like: '%' + req.query['term'] + '%'
                          }
                        },
                        {
                          surname: {
                            $like: '%' + req.query['term'] + '%'
                          }
                        }
                        ]}
            }).then(function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })

        } else {
            Model.User.findOne({
                attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                where: {teacher: false, admin: false}
            }).then(function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })
        }
    }
});
router.get('/teachers', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.query['term']) {
            Model.User.findOne({
                attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                where: {teacher: true,
                    $or: [
                        {
                          name: {
                            $like: '%' + req.query['term'] + '%'
                          }
                        },
                        {
                          surname: {
                            $like: '%' + req.query['term'] + '%'
                          }
                        }
                        ]}
            }).then(function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })

        } else {
            Model.User.findOne({
                attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                where: {teacher: true}
            }).then(function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })
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
            var data = req.body;
            Model.Thesis.create({
                title: data.title,
                abstract: data.abstract,
                keywords: data.keywords,
                approved: false,
                authorUsername: data.author
            });
        }
    }
});


module.exports = router;