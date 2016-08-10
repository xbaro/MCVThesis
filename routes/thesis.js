var express = require('express');
var router = express.Router();

var Model = require('../models');

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {

    }
});

router.get('/:thesisID/advisors', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var id = req.params.thesisID;
        res.json({ thesisID: id , type: 'Advisor'});
    }
});

router.get('/:thesisID/committee', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var id = req.params.thesisID;
        res.json({ thesisID: id , type: 'Committee'});
    }
});


module.exports = router;