var express = require('express');
var router = express.Router();
var Model = require('../models');
var env  = process.env.NODE_ENV || "development";
const Email = require('email-templates');
var transport = require('../lib/mail');
const path = require('path');


function send_mails_committee(committee) {
    const email = new Email({
        message: {
            from: 'noreply@mcv.eimt.uoc.edu',
            attachments: [
                {
                    filename: 'EvaluationGuidelinesCommitteeEN.doc',
                    path: path.normalize(path.join(__dirname, '..', 'emails', 'committees', 'EvaluationGuidelinesCommitteeEN.doc'))
                }
            ],
        },
        send: true,
        transport: transport
    });

    email
        .send({
            template: 'committees',
            message: {
                to: 'Xavier Baró <xavierbaro@gmail.com>, Xavier Baró <xbaro@uoc.edu>',
            },
            locals: {
                learner_name: 'Name of the learner',
                learner_mail: 'xxx@dddd.aaa',
                title: 'Thesis title',
                abstract: 'Thesis abstract',
                president: 'name and email of president',
                secretary: 'name and email of secretary',
                vocal: 'name and email of vocal',
                place: 'Where the committee is',
                date: 'When the committee is'
            }
        })
        .then(console.log)
        .catch(console.error);

}

function get_host_http(req) {
    var port = req.app.get('port');
    var host = req.headers.host;

    var host_parts = host.split(':');

    if (host_parts.length > 1) {
        host = host_parts[0];
    }

    if (env === "production" || port === 80) {
        return host;
    }

    return host + ':' + port;
}

function get_host_https(req) {
    var port = req.app.get('port-ssl');
    var host = req.headers.host;

    var host_parts = host.split(':');

    if (host_parts.length > 1) {
        host = host_parts[0];
    }

    if (env === "production" || port === 443) {
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
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/notify/committees', function (req, res) {
    if (!req.isAuthenticated()) {

        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                send_mails_committee(null);
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/notify/advisors', function (req, res) {
    if (!req.isAuthenticated()) {

        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});


router.get('/notify/learners', function (req, res) {
    if (!req.isAuthenticated()) {

        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

module.exports = router;