var express = require('express');
var router = express.Router();
var Model = require('../models');

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        res.render('thesis', { page_name: 'thesis', user : req.user });
    }
});

router.get('/user_data', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        Model.User.findOne({attributes: ['username', 'name', 'organization', 'surname', 'email', 'webpage', 'teacher', 'admin', 'roles', 'keywords', 'full_name'],
            where: {username: req.user.username}})
        .then(function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        })
    }
});

router.get('/authored', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        req.user.getAuthor(
        {
            include: [
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                },
                {
                    model: Model.User,
                    as: 'Advised',
                    attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                },
                {
                    model: Model.User,
                    as: 'Reviewed',
                    attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                }
            ]
        }).then(function(data) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data));
        });
    }
});

router.get('/advised', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        req.user.getAdvisor(
            {
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                    },
                    {
                        model: Model.User,
                        as: 'Advised',
                        attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                    },
                    {
                        model: Model.User,
                        as: 'Reviewed',
                        attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                    }
                ]
            }
        ).then(function(data) {
            res.setHeader('Content-Type', 'application/json');
            result=JSON.stringify(data);
            res.send(result);
        });
    }
});

router.get('/students', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.user.teacher || req.user.admin) {
            if (req.query['term']) {
                Model.User.findOne({
                    attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                    where: {
                        $and: [
                            {
                                teacher: false,
                                admin: false,
                            },
                            Model.Sequelize.literal("lower(concat_ws(' ', User.name, User.surname)) like '%" + req.query['term'].toLowerCase() + "%'" ),
                        ]
                    }
                }).then(function (data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                })

            } else {
                Model.User.findOne({
                    attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                    where: {teacher: false, admin: false}
                }).then(function (data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                })
            }
        } else {
            Model.User.findOne({
                    attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                    where: {username: req.user.username}
                }).then(function (data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                })
        }
    }
});
router.get('/teachers', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.query['term']) {
            Model.User.findOne({
                attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                where: {
                    $and: [
                        {
                            teacher: true,
                        },
                        Model.Sequelize.literal("lower(concat_ws(' ', User.name, User.surname)) like '%" + req.query['term'].toLowerCase() + "%'"),
                    ]
                }
            }).then(function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })

        } else {
            Model.User.findOne({
                attributes: ['username', 'name', 'surname', 'full_name', 'roles'],
                where: {teacher: true}
            }).then(function (data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            })
        }
    }
});

router.post('/:thesisID/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var data = req.body;
        var username = req.user.username;
        if (req.user.teacher || req.user.admin) {
            username = data.author;
        } else {
            if(req.user.username!=data.author) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
                return;
            }
        }
        Model.Thesis.update({
            title: data.title,
            abstract: data.abstract,
            keywords: data.keywords,
            nda: data.nda
        }, {
            where: { id: data.id }
        }).then(function(result) {
            if(result && result[0]) {
                Model.Thesis.findById(data.id).then(function (thesis) {
                    if (thesis) {
                        Model.User.findById(username).then(function (author) {
                            thesis.setUser(author).then(function (aThesis) {
                                var adList = data['advisors'];
                                Model.User.findAll({
                                    where: {username: data.advisors}
                                }).then(function (advisors) {
                                    thesis.setAdvised(advisors).then(function (data) {

                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify({error: false, message: 'Thesis created'}));
                                    });
                                });
                            });
                        });
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'Thesis not find when updating relations' }, null, 3));
                    }
                });
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Thesis not updated' }, null, 3));
            }
        });
    }
});

router.post('/:thesisID/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var thesisID = req.params.thesisID;
        Model.Thesis.findById(thesisID).then(function(thesis){
            if(thesis) {
                if(thesis.approved && !req.user.teacher && !req.user.admin) {
                    res.setHeader('Content-Type', 'application/json');
                    res.status(401);
                    res.send(JSON.stringify({ error: 'Forbidden' }, null, 3));
                } else {
                    if(!thesis.approved && !req.user.teacher && !req.user.admin && thesis.UserUsername!=req.user.username) {
                        res.setHeader('Content-Type', 'application/json');
                        res.status(401);
                        res.send(JSON.stringify({ error: 'Forbidden' }, null, 3));
                    }  else {
                            Model.Thesis.destroy(
                            {
                                where: { id: thesisID },
                                cascade: true
                            })
                            .then(function (result) {
                                if (result == 1) {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify({status: 'ok', message:'Thesis deleted'}));
                                } else {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.status(500);
                                    res.send(JSON.stringify({status: 'ko', message:'The thesisID is invalid'}));
                                }
                            });
                    }
                }
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.status(500);
                res.send(JSON.stringify({status: 'ko', message:'The thesisID is invalid'}));
            }
        });
    }
});

router.post('/:thesisID/approve', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var thesisID = req.params.thesisID;
        if(req.user.teacher || req.user.admin) {
            Model.Thesis.update({
                    approved: true
                },
                {
                    where: { id: thesisID }
                })
                .then(function (result) {
                    if (result[0] == 1) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({status: 'ok', message:'Thesis approved'}));
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.statusCode(500);
                        res.send(JSON.stringify({status: 'ko', message:'The thesisID is invalid'}));
                    }
                });

        } else {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Forbidden' }, null, 3));
        }
    }
});

router.post('/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var data = req.body;
        var username = req.user.username;
        if (req.user.teacher || req.user.admin) {
            username = data.author;
        }
        Model.Thesis.create({
            title: data.title,
            abstract: data.abstract,
            keywords: data.keywords,
            approved: false,
            nda: data.nda
        }).then(function(thesis) {
            if(thesis) {
                Model.User.findById(username).then(function(author) {
                    thesis.setUser(author).then(function(aThesis) {
                        var adList = data['advisors'];
                        Model.User.findAll({where: { username: data.advisors }
                        }).then(function (advisors) {
                            thesis.setAdvised(advisors).then(function (data) {

                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify({error: false, message:'Thesis created'}));
                            });
                        });
                    });
                });
            }
        });
    }
});

router.get('/open', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({error: 'Unauthorized access'}, null, 3));
        } else {
            let query = {
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved'],
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name'],
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Advised"
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization', 'email'],
                        as: "Reviewed",
                        required: false,
                    },
                    {
                        model: Model.Slot,
                        attributes: ['id', 'start', 'end', 'place', 'room'],
                        required: false
                    }
                ]
            };

            let paginate = false;
            if (req.query.offset && req.query.limit) {
                query.offset = Number.parseInt(req.query.offset);
                query.limit = Number.parseInt(req.query.limit);
                paginate = true;
            }
            if(req.query.sort) {
                query.order = [[req.query.sort, req.query.order]];
            }
            if(req.query.search) {
                query.where = {
                    $or: [
                        Model.Sequelize.literal("lower(concat_ws(' ', User.name, User.surname)) like '%" + req.query.search.toLowerCase() + "%'" ),
                        Model.Sequelize.literal("lower(concat_ws(' ', Advised.name, Advised.surname)) like '%" + req.query.search.toLowerCase() + "%'" ),
                        Model.Sequelize.literal("lower(concat_ws(' ', Reviewed.name, Reviewed.surname)) like '%" + req.query.search.toLowerCase() + "%'" ),
                        Model.Sequelize.literal("lower(Thesis.abstract) like '%" + req.query.search.toLowerCase() + "%'" ),
                        Model.Sequelize.literal("lower(Thesis.title) like '%" + req.query.search.toLowerCase() + "%'" ),
                    ]
                }
            }

            Model.Thesis.findAndCountAll(query).then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                if(paginate) {
                    res.send(JSON.stringify({total: data.count, rows: data.rows}));
                } else {
                    res.send(JSON.stringify(data.rows));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering unassigned theses' }, null, 3));
            });
        }
    }
});

router.get('/:thesisID', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        var thesisID = req.params.thesisID;
        Model.Thesis.findById(thesisID, {
            include: [
                        {
                            model: Model.User,
                            attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                        },
                        {
                            model: Model.User,
                            as: 'Advised',
                            attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                        },
                        {
                            model: Model.User,
                            as: 'Reviewed',
                            attributes: ['username', 'name', 'surname', 'full_name', 'roles', 'organization', 'email'],
                        }
                    ]
        }).then(function(thesis){
            if (thesis) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(thesis, null, 3));
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Thesis not found' }, null, 3));
            }
        });
    }
});

module.exports = router;
