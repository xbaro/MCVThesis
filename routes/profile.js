var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var Model = require('../models');

var saltRounds = 10;

var env  = process.env.NODE_ENV || "development";
function get_host_http(req) {
    var port = req.app.get('port')
    var host = req.headers.host;

    var host_parts = host.split(':');

    if (host_parts.length > 1) {
        host = host_parts[0];
    }

    if (env === "production" || port == 80) {
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

    if (env === "production" || port == 443) {
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

router.post('/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            var user = req.body;
            if (!req.user.admin && user.username !== req.user.username) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var institution = user.institution;
                if (institution < 0) {
                    institution = null;
                }
                Model.User.update({
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    organization: user.organization,
                    institution: institution,
                    keywords: user.keywords,
                    webpage: user.webpage
                },
                {
                    where: { username: req.user.username }
                })
                .then(function (result) {
                    if (result[0] == 1) {
                        res.render('profile', {
                            page_name: 'profile',
                            user: req.user,
                            message_ok: "Profile updated."
                        });
                    } else {
                        res.render('profile', {
                            page_name: 'profile',
                            user: req.user,
                            message_error: "Error on the update.."
                        });
                    }
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/password', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            var user = req.body;
            if (!req.user.admin && user.username !== req.user.username) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var hash = bcrypt.hashSync(user.password, saltRounds);

                if (user.password === user.password_repeat) {
                    Model.User.update({
                            password: hash
                        },
                        {
                            where: {username: req.user.username}
                        })
                        .then(function (result) {
                            if (result[0] == 1) {
                                res.render('profile', {
                                    page_name: 'profile',
                                    user: req.user,
                                    message_ok: "Password updated."
                                });
                            } else {
                                res.render('profile', {
                                    page_name: 'profile',
                                    user: req.user,
                                    message_error: "Error updating the password."
                                });
                            }
                        });
                } else {
                    res.render('profile', {
                        page_name: 'profile',
                        user: req.user,
                        message_error: "Passwords do not match."
                    });
                }
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

module.exports = router;