var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var Model = require('../models');
var saltRounds = 10;

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        res.render('profile', { page_name: 'profile', user : req.user });
    }
});

router.post('/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
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
    }
});

router.post('/password', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
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
    }
});

module.exports = router;