var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
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
                    attributes: ['username', 'name', 'organization', 'surname', 'email', 'webpage', 'teacher', 'admin', 'roles', 'keywords']
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
                var teacher = user.roles.indexOf('teacher') !== -1
                var admin = user.roles.indexOf('admin') !== -1
                var password = user.password;
                var hash = bcrypt.hashSync(password);
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

                Model.User.update({
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    organization: user.organization,
                    keywords: user.keywords,
                    teacher: teacher,
                    admin: admin
                },
                {
                    where: { username: user.username }
                })
                .then(function (result) {
                    if (result[0] == 1) {
                        if (user.change_password) {
                            var password = user.password;
                            var hash = bcrypt.hashSync(password);
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
                start: data.start,
                end: data.end,
                capacity: data.capacity,
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
                capacity: slot.capacity
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
                    include: [
                        {
                            model: Model.Track,
                            attributes: ['id', 'title', 'keywords'],
                            include: [
                                {
                                    model: Model.Slot,
                                    attributes: ['id', 'place', 'start', 'end', 'capacity'],
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
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});



module.exports = router;