var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var passport = require('passport');
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

/* Methods for authentication */
router.get('/signin', function (req, res, next) {
    if (req.isAuthenticated())
        res.redirect('/');
    if (req.secure) {        
        res.render('signin', { title: 'Sign In' });
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + get_host_https(req) + req.originalUrl);
    }
});

router.post('/signin', function (req, res, next) {
    if (req.secure) {
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: '/auth/signin'
        }, function (err, user, info) {
            if (err) {
                return res.render('signin', { title: 'Sign In', errorMessage: err.message });
            }
            
            if (!user) {
                return res.render('signin', { title: 'Sign In', errorMessage: info.message });
            }
            return req.logIn(user, function (err) {
                if (err) {
                    return res.render('signin', { title: 'Sign In', errorMessage: err.message });
                } else {
                    return res.redirect('/');
                }
            });
        })(req, res, next);
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + get_host_https(req) + req.originalUrl);
    }
});

router.get('/signup', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        if (req.secure) {
            res.render('signup', { title: 'Sign Up' });
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/signup',  function (req, res, next) {
    var user = req.body;

    Model.User.findOne({ where: {username: user.username} }).then(function(model) {
        if (model) {
            res.render('signup', { title: 'signup', errorMessage: 'username already exists' });
        } else if (user.password != user.password_repeat) {
            res.render('signup', {title: 'signup', errorMessage: 'passwords do not match'});
        } else{

            var password = user.password;
            var hash = bcrypt.hashSync(password);

            Model.User
                .findOrCreate({where: {username: user.username, password: hash, name: user.name, surname: user.surname, email: user.email, webpage: user.webpage, organization: user.organization}})
                .spread(function(user, created) {
                    if()
                    //res.render('signin', { title: 'Sign In' });
                    passport.authenticate('local', {
                        successRedirect: '/',
                        failureRedirect: '/auth/signin'
                    }, function (err, user, info) {
                        if (err) {
                            return res.render('signin', { title: 'Sign In', errorMessage: err.message });
                        }

                        if (!user) {
                            return res.render('signin', { title: 'Sign In', errorMessage: info.message });
                        }
                        return req.logIn(user, function (err) {
                            if (err) {
                                return res.render('signin', { title: 'Sign In', errorMessage: err.message });
                            } else {
                                return res.redirect('/');
                            }
                        });
                    })(req, res, next);
                });
        }
    });
});

router.get('/signout', function (req, res, next) {
    if (!req.isAuthenticated()) {
        res.redirect('/');
    } else {
        req.logout();
        res.redirect('/');
    }
});

router.post('/lti',  function (req, res, next) {
    if (req.secure) {
        passport.authenticate('lti', {
            successRedirect: '/',
            failureRedirect: '/auth/signin'
        }, function (err, user, info) {
            if (err) {
                return res.render('signin', { title: 'Sign In', errorMessage: err.message });
            }

            if (!user) {
                return res.render('signin', { title: 'Sign In', errorMessage: info.message });
            }
            return req.logIn(user, function (err) {
                if (err) {
                    return res.render('signin', { title: 'Sign In', errorMessage: err.message });
                } else {
                    return res.redirect('/');
                }
            });
        })(req, res, next);
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + get_host_https(req) + req.originalUrl);
    }
});


module.exports = router;