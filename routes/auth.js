var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var passport = require('passport');
var Model = require('../models');
var mailer = require('../lib/mail');
const password_gen = require('secure-random-password');

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
            var hash = bcrypt.hashSync(password, saltRounds);
            var institution = user.institution;
            if (institution<0) {
                institution = null;
            }
            Model.User
                .findOrCreate({where: {username: user.username, password: hash, name: user.name, surname: user.surname, email: user.email, webpage: user.webpage, organization: user.organization, InstitutionId: institution}})
                .spread(function(user, created) {
                    //res.render('signin', { title: 'Sign In' });
                    passport.authenticate('local')(req, res, function () {
                        res.redirect('/');
                    });
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


router.get('/institutions', function (req, res) {
    Model.Institution.findAll({
        attributes: ['id', 'acronym', 'name', 'validated']
    })
    .then(function(data) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
    });
});

router.get('/reset_password', function (req, res) {
    if (req.secure) {
        res.render('reset_password', { title: 'Reset Password' });
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + get_host_https(req) + req.originalUrl);
    }
});

router.post('/reset_password', function (req, res) {
    if (req.secure) {
        var mail = req.body;
        Model.User.findAll({
            attributes: ['username', 'email'],
            where: {
                'email': mail.email
            }
        })
        .then(function(data) {
            if(data) {
                if (data.length === 1) {
                    var new_password = password_gen.randomPassword({characters: [password_gen.lower, password_gen.upper, password_gen.digits, password_gen.symbols] });
                    const test_message = {
                        to: data[0].email,
                        subject: 'MCV Theses management system: Password reset.',
                        html: '<h1>Password Reset</h1><p>A password reset has been requested for this email.</p><p>Your new credentials are:</p><ul><li><b>username:</b> ' + data[0].username + '</li><li><b>password:</b>' + new_password + '</li></ul><b>Please change your password on your profile.</b></p>'
                    };
                    Model.User.update({
                        password: bcrypt.hashSync(new_password, saltRounds)
                    },{
                        where: {
                            username: data[0].username,
                            email: data[0].email
                        }
                    }).then(function (result) {
                        if (result[0] === 1) {
                            mailer.sendMail(test_message, function (err, info) {
                                if (err) {
                                    res.render('reset_password', {
                                        message_error: "Password changed, but there was an error sending the mail. Please contact an administrator."
                                    });
                                } else {
                                    res.render('reset_password', {
                                        message_ok: "Mail sent."
                                    });
                                }
                            });
                        } else {
                            res.render('reset_password', {
                                message_error: "Error updating the password. Please contact an administrator."
                            });
                        }
                    });
                } else if(data.length === 0) {
                    res.render('reset_password', {
                        message_error: "This email do not correspond to any registered user."
                    });
                } else {
                    res.render('reset_password', {
                        message_error: "There are multiple accounts with this email. Please contact an administrator."
                    });
                }
            }
        });
    } else {
        // request was via http, so redirect to https
        res.redirect('https://' + get_host_https(req) + req.originalUrl);
    }
});

module.exports = router;