var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var Model = require('../models');
var saltRounds = 10;

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.render('consent', { page_name: 'consent', user: null, consent: null});
    } else {
        req.user.getConsent().then(function(consent) {
            res.render('consent', { page_name: 'consent', user: req.user, consent: consent});
        });
    }
});

router.post('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        Model.Consent.findAll({
            UserUsername: req.user.username,
        }).then(function (result) {
            if (result.length == 0) {
                Model.Consent.create({
                    UserUsername: req.user.username,
                    accepted: Date.now()
                })
                .then(function (result) {
                    if (result) {
                        res.render('consent', {
                                page_name: 'consent',
                                user: req.user,
                                consent: result,
                                message_ok: "Consent accepted."
                            });
                    } else {
                        res.render('consent', {
                            page_name: 'consent',
                            user: req.user,
                            consent: result,
                            message_error: "Error accepting the consent."
                        });
                    }
                });
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Consent already accepted' }, null, 3));
            }
        })
    }
});

module.exports = router;
