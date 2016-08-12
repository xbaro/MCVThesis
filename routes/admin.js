var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
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
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                res.render('admin', {page_name: 'admin', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/users', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                Model.User.findAll({
                    attributes: ['username', 'name', 'organization', 'surname', 'email', 'webpage', 'teacher', 'admin', 'roles']
                })
                .then(function(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/user/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var user = req.body
                var password = user.password;
                var hash = bcrypt.hashSync(password);
                var teacher = user.roles.indexOf('teacher') !== -1
                var admin = user.roles.indexOf('admin') !== -1
                Model.User
                    .findOrCreate({where: {username: user.username, password: hash, name: user.name, surname: user.surname, email: user.email, organization: user.organization, teacher: teacher, admin: admin}})
                    .spread(function(new_user, created) {
                        if (created) {
                            res.render('admin', {page_name: 'admin', user: req.user, message_ok: "The new user has been created"});
                        } else {
                            res.render('admin', {page_name: 'admin', user: req.user, message_error: "The user cannot be created. Does the username exists?"});
                        }
                    })
                    .catch(function (err) {
                        res.render('admin', {page_name: 'admin', user: req.user, message_error: "The user cannot be created. Does the username exists?"});
                    });

            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/user/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var user = req.body
                var teacher = user.roles.indexOf('teacher') !== -1;
                var admin = user.roles.indexOf('admin') !== -1;

                Model.User.update({
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    organization: user.organization,
                    teacher: teacher,
                    admin: admin
                },
                {
                    where: { username: user.username }
                })
                .then(function (result) {
                    if (result[0] == 1) {
                        res.render('admin', {
                            page_name: 'admin',
                            user: req.user,
                            message_ok: "User " + user.username + " updated."
                        });
                    } else {
                        res.render('admin', {
                            page_name: 'admin',
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

router.post('/user/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var user = req.body
                Model.User.destroy({
                    where: { username: user.username }
                })
                .then(function (result) {
                    if (result[0] == 1) {
                        res.render('admin', {
                            page_name: 'admin',
                            user: req.user,
                            message_ok: "User " + user.username + " removed."
                        });
                    } else {
                        res.render('admin', {
                            page_name: 'admin',
                            user: req.user,
                            message_error: "Error on the removal."
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

module.exports = router;