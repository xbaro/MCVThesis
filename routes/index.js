var express = require('express');
var router = express.Router();
var Model = require('../models');

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index', { page_name: 'index', user : req.user });
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
    Model.Thesis.findAll({
        attributes: ['id', 'title', 'order', 'abstract', 'nda', 'virtual_room'],
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
                attributes: ['username', 'name', 'surname', 'full_name', 'organization', 'email'],
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
            item.thesis_virtual_room = thesis.virtual_room;
            item.thesis_nda = thesis.nda;
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
            item.committee.president.email = '';
            item.committee.president.organization = '';
            item.committee.secretary = {};
            item.committee.secretary.name = '';
            item.committee.secretary.email = '';
            item.committee.secretary.organization = '';
            item.committee.vocal = {};
            item.committee.vocal.name = '';
            item.committee.vocal.email = '';
            item.committee.vocal.organization = '';
            for(i = 0; i<thesis.Reviewed.length; i++) {
                if(thesis.Reviewed[i].Committee.president) {
                    item.committee.president.name = thesis.Reviewed[i].full_name;
                    item.committee.president.organization = thesis.Reviewed[i].organization;
                    item.committee.president.email = thesis.Reviewed[i].email;
                }
                if(thesis.Reviewed[i].Committee.secretary) {
                    item.committee.secretary.name = thesis.Reviewed[i].full_name;
                    item.committee.secretary.organization = thesis.Reviewed[i].organization;
                    item.committee.secretary.email = thesis.Reviewed[i].email;
                }
                if(thesis.Reviewed[i].Committee.vocal) {
                    item.committee.vocal.name = thesis.Reviewed[i].full_name;
                    item.committee.vocal.organization = thesis.Reviewed[i].organization;
                    item.committee.vocal.email = thesis.Reviewed[i].email;
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

router.get('/stats/:periodId/advised', function (req, res) {
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
                attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                include: [
                    {
                        model: Model.Institution,
                        required: false
                    },
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
                        as: 'Committee',
                        required: false,
                        include: [
                            {
                                model: Model.Slot,
                                required: false,
                                include:[
                                    {
                                        model: Model.Track,
                                        required: false,
                                        include: [
                                            {
                                                model: Model.Period,
                                                where: {id: periodId},
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

router.get('/stats/:periodId/committees', function (req, res) {
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
            Model.Institution.findAll({
                attributes: ['acronym', 'name'],
                include: [
                    {
                        model: Model.User,
                        attributes: ['name', 'surname'],
                        include: [
                            {
                                model: Model.Thesis,
                                as: 'Committee',
                                include: [
                                    {
                                        model: Model.Slot,
                                        include:[
                                            {
                                                model: Model.Track,
                                                include: [
                                                    {
                                                        model: Model.Period,
                                                        where: {id: periodId},
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            })
            .then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            });
        }
    }
});

module.exports = router;
