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
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', "order"],
                where: {approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised"
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed"
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
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', "order"],
                where: {approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised"
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed"
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
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', "order"],
                where: {SlotId: slotId, approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised"
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed"
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
            var thesisId = req.params.thesisId;
            var role = req.params.role;
            var select = {};
            select[role] = true;
            select.ThesisId = thesisId;

            return Model.sequelize.transaction(function (t) {
                return Model.Committee.count({where: select}, {transaction: t}).then(function (count) {
                    if (count > 0) {
                        throw new Error();
                    } else {
                        var attribs = {};
                        attribs[role] = true;
                        attribs.UserUsername = req.user.username,
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

module.exports = router;