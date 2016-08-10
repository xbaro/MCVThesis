var express = require('express');
var router = express.Router();

var Model = require('../models');

router.get('/', function (req, res) {    
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
  
    }
});

module.exports = router;