var express = require('express');
var router = express.Router();
var Model = require('../models');

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        res.render('committees', { page_name: 'committees', user : req.user });
    }
});

router.get('/my', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        Model.Thesis.findAll({
            attributes: ['id', 'title', 'order', 'virtual_room', 'rubrics_folder'],
            include: [
                {
                    model: Model.Slot,
                    attributes: ['id', 'place', 'start', 'end', 'duration', 'room'],
                    include: [
                        {
                            model: Model.Track,
                            attributes: ['id', 'title'],
                            include: [
                                {
                                    model: Model.Period,
                                    attributes: ['id', 'title','end'],
                                    where: {
                                        end: {
                                            $or: {
                                                $gt: new Date(),
                                                $eq: null
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                    where: {username: req.user.username},
                    as: "Reviewed",
                    required: true,
                    include: [
                        {
                            model: Model.Institution,
                            attributes: ['acronym', 'name'],
                            required: false
                        }
                    ]
                },
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name'],
                    include: [
                        {
                            model: Model.Institution,
                            attributes: ['acronym', 'name'],
                            required: false
                        }
                    ]
                }
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
                item.thesis_virtual_room = thesis.virtual_room;
                item.thesis_rubrics_folder = thesis.rubrics_folder;
                item.date = thesis.Slot.start;
                item.start = s_date.getHours() + ":" + ("0" + s_date.getMinutes()).slice(-2);
                item.end = e_date.getHours() + ":" + ("0" + e_date.getMinutes()).slice(-2);
                item.start_date = s_date;
                item.end_date = e_date;
                item.place = thesis.Slot.place;
                item.room = thesis.Slot.room;
                if(thesis.Reviewed && thesis.Reviewed.length>0) {
                    if(thesis.Reviewed[0].Committee) {
                        item.role = thesis.Reviewed[0].Committee.role;
                    }
                }
                return item;
            });
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tdata));
        });
    }
});

router.get('/periods/open', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        Model.Period.findAll({
            attributes: ['id', 'title', 'start', 'end', 'locked'],
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

router.get('/theses/period', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin && !req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({error: 'Unauthorized access'}, null, 3));
        } else {
            var periodId = req.query.id;
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', "order", 'nda'],
                where: {approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised",
                        include: [
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed",
                        include: [
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.Slot,
                        attributes: ['id', 'place', 'start', 'end', 'capacity', 'duration'],
                        include: [
                            {
                                model: Model.Track,
                                attributes: ['id', 'title', 'keywords'],
                                include: [
                                    {
                                        model:Model.Period,
                                        attributes: ['id', 'title', 'start', 'end'],
                                        where: {id: periodId}
                                    }
                                ]
                            }
                        ]

                    }
                ]
            }).then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering unassigned theses' }, null, 3));
            });
        }
    }
});

router.get('/theses/track', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin && !req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({error: 'Unauthorized access'}, null, 3));
        } else {
            var trackId = req.query.id;
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', "order", 'nda'],
                where: {approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised",
                        include: [
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed",
                        include: [
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.Slot,
                        attributes: ['id', 'place', 'start', 'end', 'capacity', 'duration'],
                        include: [
                            {
                                model: Model.Track,
                                attributes: ['id', 'title', 'keywords'],
                                where: {id: trackId}
                            }
                        ]

                    }
                ]
            }).then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering unassigned theses' }, null, 3));
            });
        }
    }
});

router.get('/theses/slot', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin && !req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({error: 'Unauthorized access'}, null, 3));
        } else {
            var slotId = req.query.id;
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', "order", 'nda'],
                where: {SlotId: slotId, approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised",
                        include: [
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed",
                        include: [
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.Slot,
                        attributes: ['id', 'place', 'start', 'end', 'capacity', 'duration']
                    }
                ]
            }).then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering unassigned theses' }, null, 3));
            });
        }
    }
});

router.post('/theses/assign/:thesisId/:role', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({error: 'User not authenticated'}, null, 3));
    } else {
        if (!req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({error: 'Unauthorized access'}, null, 3));
        } else {
            var data = req.body;
            var thesisId = req.params.thesisId;
            var role = req.params.role;
            var select = {};
            var username = req.user.username;
            select[role] = true;
            select.ThesisId = thesisId;

             if(req.user.admin && data && data.username) {
                 username = data.username;
             }

            return Model.sequelize.transaction(function (t) {
                return Model.Committee.count({where: select}, {transaction: t}).then(function (count) {
                    if (count > 0) {
                        throw new Error();
                    } else {
                        var attribs = {};
                        attribs[role] = true;
                        attribs.UserUsername = username,
                            attribs.ThesisId = thesisId;

                        return Model.Committee.create(attribs, {transaction: t});
                    }
                });
            }).then(function (result) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({error: false, message: 'Assignation performed'}, null, 3));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({error: true, message: 'Error assigning user'}, null, 3));
            });
        }
    }
});

router.post('/theses/unassign/:thesisId', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({error: 'User not authenticated'}, null, 3));
    } else {
        if (!req.user.teacher) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({error: 'Unauthorized access'}, null, 3));
        } else {
            var thesisId = req.params.thesisId;
            var data = req.body;

            if(req.user.admin && data && data.role) {
                var select = {};
                select.ThesisId=thesisId;
                select[data.role]=true;
                Model.Committee.destroy({
                    where: select
                }).then(function (result) {
                    if (result == 1) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({error: false, message: 'Assignation removed'}, null, 3));
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({error: true, message: 'Error removing assignation'}, null, 3));
                    }
                }).catch(function (err) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: true, message: 'Error removing assignation'}, null, 3));
                });
            } else {
                Model.Committee.destroy({
                    where: {
                        UserUsername: req.user.username,
                        ThesisId: thesisId
                    }
                }).then(function (result) {
                    if (result == 1) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({error: false, message: 'Assignation removed'}, null, 3));
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({error: true, message: 'Error removing assignation'}, null, 3));
                    }
                }).catch(function (err) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: true, message: 'Error removing assignation'}, null, 3));
                });
            }
        }
    }
});

router.get('/teachers', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.query['term']) {
            Model.User.findAll({
                attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                where: {teacher: true,
                    $or: [
                        {
                          name: {
                            $like: '%' + req.query['term'] + '%'
                          }
                        },
                        {
                          surname: {
                            $like: '%' + req.query['term'] + '%'
                          }
                        }
                        ]}
            }).then(function (data) {
                var tdata=[].concat(data).map(function(user){
                    var item = {};
                    item.label = user.full_name + ' (' + user.organization + ')';
                    item.username = user.username;
                    return item;
                });
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(tdata));
            })

        } else {
            Model.User.findAll({
                attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                where: {teacher: true}
            }).then(function (data) {
                var tdata=[].concat(data).map(function(user){
                    var item = {};
                    item.label = user.full_name + ' (' + user.organization + ')';
                    item.username = user.username;
                    return item;
                });
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(tdata));
            })
        }
    }
});


module.exports = router;
