var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
var Model = require('../models');
var env  = process.env.NODE_ENV || "development";

var saltRounds = 10;

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
                res.render('admin', {page_name: 'admin', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/users', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                Model.User.findAll({
                    attributes: ['username', 'name', 'organization', 'surname', 'email', 'webpage', 'teacher', 'admin', 'roles', 'keywords'],
                    include: [
                        {
                            model: Model.Institution,
                            attributes: ['id', 'acronym', 'name'],
                        }
                    ]
                })
                .then(function(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/user/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var user = req.body;
                var teacher = user.roles.indexOf('teacher') !== -1;
                var admin = user.roles.indexOf('admin') !== -1;
                var password = user.password;
                var hash = bcrypt.hashSync(password, saltRounds);
                Model.User
                    .findOrCreate({where: {username: user.username, password: hash, name: user.name, surname: user.surname, email: user.email, organization: user.organization, keywords: user.keywords, teacher: teacher, admin: admin}})
                    .spread(function(new_user, created) {
                        if (created) {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({ error: false, message: 'User created', user: new_user}, null, 3));
                        } else {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({ error: true, message: 'Used cannot be created' }, null, 3));
                        }
                    })
                    .catch(function (err) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'The user cannot be created. Does the username exists?' }, null, 3));
                    });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/user/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var user = req.body;
                var teacher = user.roles.indexOf('teacher') !== -1;
                var admin = user.roles.indexOf('admin') !== -1;
                var institution = user.institution;

                if (user.institution < 0) {
                    institution = null;
                }

                Model.User.update({
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    organization: user.organization,
                    keywords: user.keywords,
                    teacher: teacher,
                    admin: admin,
                    InstitutionId: institution
                },
                {
                    where: { username: user.username }
                })
                .then(function (result) {
                    if (result[0] == 1) {
                        if (user.change_password) {
                            var password = user.password;
                            var hash = bcrypt.hashSync(password, saltRounds);
                            Model.User.update({
                                password: hash
                            },
                            {
                                where: { username: user.username }
                            }).then(function (result) {
                                if (result[0] == 1) {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify({error: false, message: 'User updated', user: user}, null, 3));
                                } else {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify({ error: true, message: 'Error on the password update.', user: user}, null, 3));
                                }
                            });
                        } else {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({error: false, message: 'User updated', user: user}, null, 3));
                        }
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'Error on the update.', user: user}, null, 3));
                    }
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/user/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var user = req.body
                Model.User.destroy({
                    where: { username: user.username }
                })
                .then(function (result) {
                    if (result == 1) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: false, message: "User " + user.username + " removed." }, null, 3));
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'User not deleted' }, null, 3));
                    }
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/periods', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                Model.Period.findAll({
                    attributes: ['id', 'title', 'start', 'end', 'active', 'closed']
                })
                .then(function(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/period/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var data = req.body;
            if(!data.start) {
                data.start = null;
            }
            if(!data.end) {
                data.end = null;
            }

            Model.Period.create({
                title: data.title,
                start: data.start,
                end: data.end
            }).then(function(period) {
                if (period) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Period created', period: period}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Period not created' }, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Period not created' }, null, 3));
            });

        }
    }
});

router.post('/period/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var period = req.body;
            if(!period.start) {
                period.start = null;
            }
            if(!period.end) {
                period.end = null;
            }

            Model.Period.update({
                title: period.title,
                start: period.start,
                end: period.end
            },
            {
                where: { id: period.id }
            })
            .then(function (result) {
                if (result[0] == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: false, message: 'Period updated', period: period}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Error on the period update.', period: period}, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Period not updated' }, null, 3));
            });
        }
    }
});

router.post('/period/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var period = req.body;
            Model.Period.destroy({
                where: { id: period.id }
            })
            .then(function (result) {
                if (result == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Period ' + period.title + ' deleted' }, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Period not deleted' }, null, 3));
                }
            });
        }
    }
});

router.post('/track/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var data = req.body;
            Model.Track.create({
                title: data.title,
                keywords: data.keywords,
                end: data.end,
                PeriodId: data.period_id
            }).then(function(track) {
                if (track) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Track created', track: track}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Track not created' }, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Track not created' }, null, 3));
            });

        }
    }
});

router.post('/track/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var track = req.body;

            Model.Track.update({
                title: track.title,
                keywords: track.keywords
            },
            {
                where: { id: track.id }
            })
            .then(function (result) {
                if (result[0] == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: false, message: 'Track updated', track: track}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Error on the track update.', track: track}, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Track not updated' }, null, 3));
            });
        }
    }
});

router.post('/track/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var track = req.body;
            Model.Track.destroy({
                where: { id: track.id }
            })
            .then(function (result) {
                if (result == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Track ' + track.title + ' deleted' }, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Track not deleted' }, null, 3));
                }
            });
        }
    }
});

router.post('/slot/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var data = req.body;
            if(!data.start) {
                data.start = null;
            }
            if(!data.end) {
                data.end = null;
            }

            Model.Slot.create({
                place: data.place,
                room: data.room,
                start: data.start,
                end: data.end,
                capacity: data.capacity,
                duration: data.duration,
                TrackId: data.track_id
            }).then(function(slot) {
                if (slot) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Slot created', slot: slot}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Slot not created' }, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Slot not created' }, null, 3));
            });

        }
    }
});

router.post('/slot/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var slot = req.body;
            if(!slot.start) {
                slot.start = null;
            }
            if(!slot.end) {
                slot.end = null;
            }

            Model.Slot.update({
                place: slot.place,
                start: slot.start,
                end: slot.end,
                capacity: slot.capacity,
                duration: slot.duration,
                room: slot.room
            },
            {
                where: { id: slot.id }
            })
            .then(function (result) {
                if (result[0] == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: false, message: 'Slot updated', slot: slot}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Error on the slot update.', slot: slot}, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Slot not updated' }, null, 3));
            });
        }
    }
});

router.post('/slot/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var slot = req.body;
            Model.Slot.destroy({
                where: { id: slot.id }
            })
            .then(function (result) {
                if (result == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Slot (' + slot.place + ': ' + slot.start + '-' + slot.end + ') deleted' }, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Period not deleted' }, null, 3));
                }
            });
        }
    }
});

router.post('/slot/:slotID/reorder', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var slotId = req.params.slotID;
            Model.Thesis.findAll({
                attributes: ['id', 'SlotId', 'order'],
                where: { SlotId: slotId },
                order: ['order']
            })
            .then(function (result) {
                if(result) {
                    for(var i=0; i<result.length; i++) {
                        result[i].order = i + 1;
                        result[i].save();
                    }
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: false, message: 'Slot ' + slotId + ' => order fixed' }, null, 3));
            });
        }
    }
});

router.get('/tracks/:periodID', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                var periodID = req.params.periodID;
                Model.Period.findOne({
                    attributes: ['id', 'title', 'start', 'end', 'active', 'closed'],
                    where: {id: periodID},
                    include: [
                        {
                            model: Model.Track,
                            attributes: ['id', 'title', 'keywords'],
                            include: [
                                {
                                    model: Model.Slot,
                                    attributes: ['id', 'place', 'start', 'end', 'capacity', 'room'],
                                    include: [
                                        {
                                            model: Model.Thesis,
                                            attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'order', 'approved', 'nda'],
                                            include: [
                                                {
                                                    model: Model.User,
                                                    attributes: ['username', 'name', 'surname', 'full_name']
                                                }
                                            ],
                                            order: [
                                                [Model.Thesis, 'order']
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
                        }
                    ],
                    order: [
                        [Model.Track, 'title'],
                        [Model.Track, Model.Slot, 'start'],
                        [Model.Track, Model.Slot, Model.Thesis, 'order']
                    ]
                })
                .then(function(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/thesis/:thesisID/up', function (req, res) {
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
            var thesisID = req.params.thesisID;
            Model.Thesis.findOne({attributes: ['id', 'SlotId', 'order'],where: {id: thesisID}})
                .then(function(thesis) {
                    if (thesis) {
                        if (thesis.order>1) {
                            Model.Thesis.update({
                                order: thesis.order
                            },
                            {
                                where: { SlotId: thesis.SlotId, order: thesis.order - 1}
                            })
                            .then(function (result) {
                                if (result[0] == 1) {
                                    thesis.order = thesis.order-1;
                                    thesis.save().then(function (result) {
                                        res.setHeader('Content-Type', 'application/json');
                                        res.send(JSON.stringify({
                                            error: false,
                                            message: 'Thesis updated',
                                            thesis: thesis
                                        }, null, 3));
                                    });
                                } else {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify({ error: true, message: 'Thesis order not updated', thesis: thesis}, null, 3));
                                }
                            }).catch(function (err) {
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify({ error: true, message: 'Thesis order not updated' }, null, 3));
                            });

                        }
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'Thesis order not updated' }, null, 3));
                    }
                });
        }
    }
});

router.post('/thesis/:thesisID/down', function (req, res) {
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
            var thesisID = req.params.thesisID;
            Model.Thesis.findOne({attributes: ['id', 'SlotId', 'order'],where: {id: thesisID}})
                .then(function(thesis) {
                    if (thesis) {
                        Model.Thesis.update({
                            order: thesis.order
                        },
                        {
                            where: { SlotId: thesis.SlotId, order: thesis.order + 1}
                        })
                        .then(function (result) {
                            if (result[0] == 1) {
                                thesis.order = thesis.order+1;
                                thesis.save().then(function (result) {
                                    res.setHeader('Content-Type', 'application/json');
                                    res.send(JSON.stringify({
                                        error: false,
                                        message: 'Thesis updated',
                                        thesis: thesis
                                    }, null, 3));
                                });
                            } else {
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify({ error: true, message: 'Thesis order not updated', thesis: thesis}, null, 3));
                            }
                        }).catch(function (err) {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({ error: true, message: 'Thesis order not updated' }, null, 3));
                        });
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'Thesis order not updated' }, null, 3));
                    }
                });
        }
    }
});

router.post('/thesis/:thesisID/unassign', function (req, res) {
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
            var thesisID = req.params.thesisID;
            Model.Thesis.findOne({attributes: ['id', 'SlotId', 'order'],where: {id: thesisID}})
                .then(function(thesis) {
                    if (thesis) {
                        var old_slotId = thesis.SlotId;
                        var old_order = thesis.order;
                        thesis.order = null;
                        thesis.SlotId = null;
                        thesis.save().then(function (result) {
                            Model.Thesis.update(
                                {
                                    order: Model.sequelize.literal('"order" - 1')
                                },
                                {
                                    where:
                                    {
                                        SlotId: old_slotId,
                                        order: {
                                            $gt: old_order
                                        }
                                    }
                                }
                            ).then(function(updated_data) {
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify({
                                    error: false,
                                    message: 'Thesis updated',
                                    thesis: thesis
                                }, null, 3));
                            });
                        });
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'Thesis order not updated' }, null, 3));
                    }
                }).catch(function (err) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Thesis order not updated' }, null, 3));
                });
        }
    }
});

router.post('/thesis/:thesisID/assign', function (req, res) {
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
            var thesisID = req.params.thesisID;
            var slotId = req.body.slot_id;

            Model.Thesis.findById(thesisID, {
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    }
                ]
            }).then(function(thesis) {
                if(thesis) {
                    if(thesis.SlotId == null) {
                        Model.Thesis.max('order', {where: {SlotId: slotId}}).then(function (max) {
                            if (!max) {
                                max = 0;
                            }
                            thesis.SlotId = slotId;
                            thesis.order = max + 1;
                            thesis.save().then(function (result) {
                                res.setHeader('Content-Type', 'application/json');
                                res.send(JSON.stringify({
                                    error: false,
                                    message: 'Thesis updated',
                                    thesis: thesis
                                }, null, 3));
                            });
                        });
                    } else {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify({ error: true, message: 'Thesis already assigned', thesis: thesis}, null, 3));
                    }
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Thesis not found', thesis: thesis}, null, 3));
                }
            });
        }
    }
});

router.get('/thesis/unassigned', function (req, res) {
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
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'nda'],
                where: {SlotId: null, approved: true},
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

router.get('/alerts/noslot', function (req, res) {
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
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'nda'],
                where: {SlotId: null, approved: true},
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

router.get('/alerts/noauthor', function (req, res) {
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
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'nda'],
                where: {UserUsername: null, approved: true}
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

router.get('/alerts/notapproved', function (req, res) {
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
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'nda'],
                where: {approved: false},
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

router.get('/alerts/noadvisor', function (req, res) {
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
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'nda'],
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
                        required: false
                    }
                ]
            }).then(function(data) {
                var retVal = [];
                for(var i = 0; i< data.length; i++) {
                    if(data[i].Advised.length==0) {
                        retVal.push(data[i]);
                    }
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(retVal));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering unassigned theses' }, null, 3));
            });
        }
    }
});

router.get('/alerts/nocommittee', function (req, res) {
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
            Model.Thesis.findAll({
                attributes: ['id', 'title', 'abstract', 'keywords', 'approved', 'nda'],
                where: {approved: true},
                include: [
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name']
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organizarion'],
                        as: "Advised",
                        required: false
                    },
                    {
                        model: Model.User,
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        as: "Reviewed"
                    }
                ]
            }).then(function(data) {
                var retVal = [];
                for(var i = 0; i< data.length; i++) {
                    if(data[i].Reviewed.length<3) {
                        retVal.push(data[i]);
                    }
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(retVal));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering unassigned theses' }, null, 3));
            });
        }
    }
});

router.get('/institutions', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.setHeader('Content-Type', 'application/json');
                res.status(401);
                res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
            } else {
                Model.Institution.findAll({
                    attributes: ['id', 'acronym', 'name', 'validated']
                })
                .then(function(data) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data));
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.post('/institution/new', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var data = req.body;

            Model.Institution.create({
                acronym: data.acronym,
                name: data.name,
                validated: true
            }).then(function(institution) {
                if (institution) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Institution created', institution: institution}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Institution not created' }, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Institution not created' }, null, 3));
            });

        }
    }
});

router.post('/institution/update', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var institution = req.body;

            Model.Institution.update({
                acronym: institution.acronym,
                name: institution.name
            },
            {
                where: { id: institution.id }
            })
            .then(function (result) {
                if (result[0] === 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: false, message: 'Institution updated', institution: institution}, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Error on the institution update.', institution: institution }, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Institution not updated' }, null, 3));
            });
        }
    }
});

router.post('/institution/delete', function (req, res) {
    if (!req.isAuthenticated()) {
        res.setHeader('Content-Type', 'application/json');
        res.status(401);
        res.send(JSON.stringify({ error: 'User not authenticated' }, null, 3));
    } else {
        if (!req.user.admin) {
            res.setHeader('Content-Type', 'application/json');
            res.status(401);
            res.send(JSON.stringify({ error: 'Unauthorized access' }, null, 3));
        } else {
            var institution = req.body;
            Model.Institution.destroy({
                where: { id: institution.id }
            })
            .then(function (result) {
                if (result == 1) {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: false, message: 'Institution (' + institution.acronym + ': ' + institution.name + ') deleted' }, null, 3));
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Institution not deleted' }, null, 3));
                }
            });
        }
    }
});


module.exports = router;