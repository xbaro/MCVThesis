﻿var express = require('express');
var router = express.Router();
var Model = require('../models');

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


/* GET home page. */
router.get('/', function (req, res) {
    if (req.secure) {
        // request was via https, so redirect to http
        res.redirect('http://' + get_host_http(req) + req.originalUrl);
    } else {
        res.render('index', { page_name: 'index', user : req.user });
    }    
});

/* GET configuration */
router.get('/config', function (req, res) {
    Model.Config.findAll().then(function(data) {
        if(data) {
            if (data.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data[0]));
            } else {
                Model.Config.create().then(function (data) {
                    if (data) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(data));
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({}));
                    }
                });
            }
        }
    });
});

router.get('/calendar', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        Model.Thesis.findAll({
            attributes: ['id', 'title', 'order', 'abstract'],
            include: [
                {
                    model: Model.Slot,
                    attributes: ['id', 'place', 'start', 'end', 'duration', 'room'],
                    where: {start: {
                        $gt: (new Date()-24*60*60*1000)
                    }},
                    required: true,
                    include: [
                        {
                            model: Model.Track,
                            attributes: ['id', 'title'],
                            include: [
                                {
                                    model: Model.Period,
                                    attributes: ['id', 'title', 'start', 'end']
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                    as: "Reviewed"
                },
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                    as: "Advised"
                },
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name']
                }
            ],
            order: [
                [Model.Slot, 'start'],
                [Model.Slot, 'id'],
                ['order'],
                [Model.Slot, Model.Track, 'title'],
                [Model.Slot, 'place'],
                [Model.Slot, 'room']
            ]
        })
        .then(function(data) {
            var tdata=[].concat(data).map(function(thesis){
                var s_date = new Date(new Date(thesis.Slot.start).getTime() + (thesis.order-1)*thesis.Slot.duration*60000);
                var e_date = new Date(s_date.getTime() + thesis.Slot.duration*60000);
                var item = {};
                item.thesis_id = thesis.id;
                item.thesis_title = thesis.title;
                item.thesis_author_name = thesis.User.full_name;
                item.thesis_author_username = thesis.User.username;
                item.thesis_abstract = thesis.abstract;
                item.date = thesis.Slot.start;
                item.start = s_date.getHours() + ":" + ("0" + s_date.getMinutes()).slice(-2);
                item.end = e_date.getHours() + ":" + ("0" + e_date.getMinutes()).slice(-2);
                item.place = thesis.Slot.place;
                item.duration = thesis.Slot.duration;
                item.room = thesis.Slot.room;
                item.track_id = thesis.Slot.Track.id;
                item.track_title = thesis.Slot.Track.title;
                item.committee = {};
                item.committee.president = {};
                item.committee.president.name = '';
                item.committee.president.organization = '';
                item.committee.secretary = {};
                item.committee.secretary.name = '';
                item.committee.secretary.organization = '';
                item.committee.vocal = {};
                item.committee.vocal.name = '';
                item.committee.vocal.organization = '';
                for(i = 0; i<thesis.Reviewed.length; i++) {
                    if(thesis.Reviewed[i].Committee.president) {
                        item.committee.president.name = thesis.Reviewed[i].full_name;
                        item.committee.president.organization = thesis.Reviewed[i].organization;
                    }
                    if(thesis.Reviewed[i].Committee.secretary) {
                        item.committee.secretary.name = thesis.Reviewed[i].full_name;
                        item.committee.secretary.organization = thesis.Reviewed[i].organization;
                    }
                    if(thesis.Reviewed[i].Committee.vocal) {
                        item.committee.vocal.name = thesis.Reviewed[i].full_name;
                        item.committee.vocal.organization = thesis.Reviewed[i].organization;
                    }
                }
                item.advisors = [];
                for(i = 0; i<thesis.Advised.length; i++) {
                    var adv_item = {};
                    adv_item.name = thesis.Advised[i].full_name;
                    adv_item.organization = thesis.Advised[i].organization;
                    item.advisors.push(adv_item);
                }
                return item;
            });
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tdata));
        });
    }
});

router.get('/periods', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin && !req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            Model.Period.findAll({
                attributes: ['id', 'title', 'start', 'end', 'active', 'closed'],
                order:[
                    ['start', 'DESC']
                ]
            })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

router.get('/stats/:periodId', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin && !req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var periodId = req.params.periodId;
            Model.User.findAll({
                attributes: ['username', 'name', 'surname', 'full_name', 'organization',
                    [Model.sequelize.fn('count', Model.sequelize.col('Advisor.id')), 'num_advised'],
                    [Model.sequelize.fn('count', Model.sequelize.col('Committee.id')), 'num_committee']],
                include: [
                    {
                        model: Model.Thesis,
                        as: 'Advisor',
                        include: [
                            {
                                model: Model.Slot,
                                include:[
                                    {
                                        model: Model.Track,
                                        include: [
                                            {
                                                model: Model.Period,
                                                where: {id: periodId}
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: Model.Thesis,
                        as: 'Committee'
                    }
                ],
                group: ['username', 'name', 'surname', 'organization']
            })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

module.exports = router;