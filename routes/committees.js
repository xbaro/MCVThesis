var express = require('express');
var router = express.Router();
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
            // request was via https, so redirect to http
            res.redirect('http://' + get_host_http(req) + req.originalUrl);
        } else {
            res.render('committees', { page_name: 'committees', user : req.user });
        }
    }
});

router.get('/periods/open', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        Model.Period.findAll({
            attributes: ['id', 'title', 'start', 'end', 'active', 'closed'],
            where: {
                  end: {
                        $or: {
                              $gt: new Date(),
                              $eq: null
                        }
                }
            },
            include: [
                {
                    model: Model.Track,
                    attributes: ['id', 'title', 'keywords'],
                    include: [
                        {
                            model: Model.Slot,
                            attributes: ['id', 'place', 'start', 'end', 'capacity'],
                            include: [
                                {
                                    model: Model.Thesis,
                                    attributes: ['id', 'title'],
                                    include: [
                                        {
                                            model: Model.Committee,
                                            attributes: ['president', 'secretary', 'vocal', 'waiting'],
                                            include: [
                                                {
                                                    model: Model.User,
                                                    attributes: ['username', 'name', 'surname', 'full_name', 'organization']
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ],
                            order: [
                                [Model.Thesis, 'order' ]
                            ]
                        }
                    ],
                    order: [
                        [Model.Slot, 'start']
                    ]
                }
            ],
            order: [
                [Model.Track, 'title']
            ]
        })
        .then(function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        });
    }
});


module.exports = router;