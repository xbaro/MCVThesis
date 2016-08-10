var express = require('express');
var router = express.Router();
var Model = require('../models');

/* GET home page. */
router.get('/', function (req, res) {
    if (req.secure) {
        // request was via https, so redirect to http
        res.redirect('http://' + req.headers.host + req.originalUrl);
    } else {
        res.render('index', { title: 'Chalearn Video Selector', user : req.user });        
    }    
});

module.exports = router;