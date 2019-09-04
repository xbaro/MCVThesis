var express = require('express');
var router = express.Router();
var Model = require('../models');
var env  = process.env.NODE_ENV || "development";
const Email = require('email-templates');
var transport = require('../lib/mail');
const path = require('path');
const logger = require('../logger');
const moment = require('moment');

function closeGroupWithError(group, error) {
    Model.NotificationGroup.update(
    {
        states: 'failed',
        end: Date()
    },
    {
        where: {
            id: group.id
        }
    });
}

function updateGroupStatus(group, callback, error) {
    Model.NotificationGroup.findAll(
        {
            where: {
                id: group.id,
                states: 'pending'
            },
            include: [
                {
                    model: Model.NotificationGroup,
                    required: false,
                    as: 'Children'
                },
                {
                    model: Model.Notification,
                    required: false,
                }
            ]
        }
    ).then(function(data) {
        if(data && data.length === 1) {
            var num_pending = 0;
            var num_sent = 0;
            var num_failed = false;

            for(var i=0; i<data[0].Children.length; i++) {
                if (data[0].Children[i].states === 'pending') {
                    num_pending++;
                } else if (data[0].Children[i].states === 'failed') {
                    num_failed++;
                } else if (data[0].Children[i].states === 'sent') {
                    num_sent++;
                }
            }
            for(var j=0; j<data[0].Notifications.length; j++) {
                if (data[0].Notifications[j].states === 'pending') {
                    num_pending++;
                } else if (data[0].Notifications[j].states === 'failed') {
                    num_failed++;
                } else if (data[0].Notifications[j].states === 'sent') {
                    num_sent++;
                }
            }
            if (num_pending === 0) {
                if(num_failed === 0) {
                    Model.NotificationGroup.update(
                        {
                            states: 'sent',
                            end: Date()
                        },
                        {
                            where: {
                                id: data.id
                            }
                        }).then(callback).catch(error);
                } else {
                    Model.NotificationGroup.update(
                        {
                            states: 'failed',
                            end: Date()
                        },
                        {
                            where: {
                                id: data.id
                            }
                        }).then(error).catch(error);
                }
            }
        }
        error('Invalid data when updating group status');
    }).catch(error);
}

function updateNotificationStatus(notification, status, callback, error) {
    Model.Notification.update(
    {
        states: status,
        end: Date()
    },
    {
        where: {
            id: notification.id
        }
    })
        .then(callback)
        .catch(error);
}

function send_committee_mail(email, member, group, data, callback, error) {
    Model.Notification.create({
        type: 'notify_committee',
        data: JSON.stringify(data),
        NotificationGroupId: group.id,
        start: Date(),
        states: 'pending',
        fromUserUsername: group.fromUserUsername,
        toUserUsername: member.username
    }).then(function(notification) {
        if (notification) {
            var advisors = '';
            for(var i=0; i<data.advisors.length; i++) {
                if (i>0) {
                    advisors += ', ';
                }
                advisors += `${data.advisors[i].name} (${data.advisors[i].institution}) <${data.advisors[i].email}>`;
            }
            email
                .send({
                    template: 'committees',
                    message: {
                        to: `${member.full_name} <${member.email}>`,
                    },
                    locals: {
                        learner_name: data.thesis_author_name,
                        learner_mail: data.thesis_author_email,
                        title: data.thesis_title,
                        abstract: data.thesis_abstract,
                        president: `${data.committee.president.name} (${data.committee.president.institution}) <${data.committee.president.email}>`,
                        secretary: `${data.committee.secretary.name} (${data.committee.secretary.institution}) <${data.committee.secretary.email}>`,
                        vocal: `${data.committee.vocal.name} (${data.committee.vocal.institution}) <${data.committee.vocal.email}>`,
                        advisors: advisors,
                        place: data.place,
                        room: data.room,
                        start: data.start,
                        end: data.end,
                        date: moment(data.date).format('ddd DD/MM/YYYY')
                    }
                })
                .then(function() {
                    updateNotificationStatus(notification, 'sent', function() {
                        if (callback) {
                            callback(notification);
                        }
                    }, error);
                })
                .catch(function(err) {
                    updateNotificationStatus(notification, 'failed');
                    closeGroupWithError(group, err);
                    if(error) {
                        error(err);
                    }
                });
        }
    }).catch(function(err) {
        closeGroupWithError(group, err);
        if(error) {
            error(err);
        }
    });
}

function send_committee_notifications(data, group, callback, error) {
    Model.NotificationGroup.create({
        type: 'notify_committee',
        NotificationGroupId: group.id,
        start: Date(),
        states: 'pending',
        fromUserUsername: group.fromUserUsername,
        expectedNotifications: 3
    }).then(function(subgroup) {
        if (subgroup) {
            const email = new Email({
                message: {
                    from: 'noreply@mcv.eimt.uoc.edu',
                    attachments: [
                        {
                            filename: 'EvaluationGuidelinesCommitteeEN.doc',
                            path: path.normalize(path.join(__dirname, '..', 'emails', 'committees', 'EvaluationGuidelinesCommitteeEN.doc'))
                        }
                    ],
                },
                send: true,
                transport: transport
            });
            send_committee_mail(email, data.committee.president, subgroup, data,
                function(notification) {
                    updateGroupStatus(subgroup, callback, error);
                },function(err) {
                    closeGroupWithError(subgroup, err);
                    if(error) {
                        error(err);
                    }
                });
            send_committee_mail(email, data.committee.secretary, subgroup, data,
                function(notification) {
                    updateGroupStatus(subgroup, callback, error);
                },function(err) {
                    closeGroupWithError(subgroup, err);
                    if(error) {
                        error(err);
                    }
                });
            send_committee_mail(email, data.committee.vocal, subgroup, data,
                function(notification) {
                    updateGroupStatus(subgroup, callback, error);
                },function(err) {
                    closeGroupWithError(subgroup, err);
                    if(error) {
                        error(err);
                    }
                });
        } else {
            if(error) {
                error(err);
            }
        }
    }).catch(function (err) {
        if (error) {
            error(err);
        }
    });
}

function get_committees_period(periodId, callback) {
    Model.Thesis.findAll({
        attributes: ['id', 'title', 'order', 'abstract'],
        include: [
            {
                model: Model.Slot,
                attributes: ['id', 'place', 'start', 'end', 'duration', 'room'],
                required: true,
                include: [
                    {
                        model: Model.Track,
                        attributes: ['id', 'title'],
                        include: [
                            {
                                model: Model.Period,
                                attributes: ['id', 'title', 'start', 'end'],

                            }
                        ]
                    }
                ]
            },
            {
                model: Model.User,
                attributes: ['username', 'name', 'surname', 'full_name', 'organization', 'InstitutionId', 'email'],
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
                model: Model.User,
                attributes: ['username', 'name', 'surname', 'full_name', 'organization', 'InstitutionId', 'email'],
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
                attributes: ['username', 'name', 'surname', 'full_name', 'email']
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
        var tdata = [].concat(data).map(function (thesis) {
            var s_date = new Date(new Date(thesis.Slot.start).getTime() + (thesis.order - 1) * thesis.Slot.duration * 60000);
            var e_date = new Date(s_date.getTime() + thesis.Slot.duration * 60000);
            var item = {};
            item.thesis_id = thesis.id;
            item.thesis_title = thesis.title;
            if(thesis.User === null) {
                item.thesis_author_name = null;
                item.thesis_author_username = null;
                item.thesis_author_email = null;
            } else {
                item.thesis_author_name = thesis.User.full_name;
                item.thesis_author_username = thesis.User.username;
                item.thesis_author_email = thesis.User.email;
            }
            item.thesis_abstract = thesis.abstract;
            if(thesis.Slot === null) {
                item.date = null;
                item.start = null;
                item.end = null;
                item.place = null;
                item.duration = null;
                item.room = null;
                item.track_id = null;
                item.track_title = null;
            } else {
                item.date = thesis.Slot.start;
                item.start = s_date.getHours() + ":" + ("0" + s_date.getMinutes()).slice(-2);
                item.end = e_date.getHours() + ":" + ("0" + e_date.getMinutes()).slice(-2);
                item.place = thesis.Slot.place;
                item.duration = thesis.Slot.duration;
                item.room = thesis.Slot.room;
                item.track_id = thesis.Slot.Track.id;
                item.track_title = thesis.Slot.Track.title;
            }
            item.committee = {};
            item.committee.president = {};
            item.committee.president.name = '';
            item.committee.president.email = '';
            item.committee.president.organization = '';
            item.committee.president.institution = '';
            item.committee.president.username = '';
            item.committee.secretary = {};
            item.committee.secretary.name = '';
            item.committee.secretary.email = '';
            item.committee.secretary.organization = '';
            item.committee.secretary.institution = '';
            item.committee.secretary.username = '';
            item.committee.vocal = {};
            item.committee.vocal.name = '';
            item.committee.vocal.email = '';
            item.committee.vocal.organization = '';
            item.committee.vocal.institution = '';
            item.committee.vocal.username = '';
            for (i = 0; i < thesis.Reviewed.length; i++) {
                if (thesis.Reviewed[i].Committee.president) {
                    item.committee.president.name = thesis.Reviewed[i].full_name;
                    if (thesis.Reviewed[i].Institution) {
                        item.committee.president.institution = thesis.Reviewed[i].Institution.acronym;
                    } else {
                        item.committee.president.institution = thesis.Reviewed[i].organization;
                    }
                    item.committee.president.organization = thesis.Reviewed[i].organization;
                    item.committee.president.email = thesis.Reviewed[i].email;
                    item.committee.president.username = thesis.Reviewed[i].username;
                }
                if (thesis.Reviewed[i].Committee.secretary) {
                    item.committee.secretary.name = thesis.Reviewed[i].full_name;
                    if (thesis.Reviewed[i].Institution) {
                        item.committee.secretary.institution = thesis.Reviewed[i].Institution.acronym;
                    } else {
                        item.committee.secretary.institution = thesis.Reviewed[i].organization;
                    }
                    item.committee.secretary.organization = thesis.Reviewed[i].organization;
                    item.committee.secretary.email = thesis.Reviewed[i].email;
                    item.committee.secretary.username = thesis.Reviewed[i].username;
                }
                if (thesis.Reviewed[i].Committee.vocal) {
                    item.committee.vocal.name = thesis.Reviewed[i].full_name;
                    if (thesis.Reviewed[i].Institution) {
                        item.committee.vocal.institution = thesis.Reviewed[i].Institution.acronym;
                    } else {
                        item.committee.vocal.institution = thesis.Reviewed[i].organization;
                    }
                    item.committee.vocal.organization = thesis.Reviewed[i].organization;
                    item.committee.vocal.email = thesis.Reviewed[i].email;
                    item.committee.vocal.username = thesis.Reviewed[i].username;
                }
            }
            item.advisors = [];
            for (i = 0; i < thesis.Advised.length; i++) {
                var adv_item = {};
                adv_item.name = thesis.Advised[i].full_name;
                if (thesis.Advised[i].Institution) {
                        adv_item.institution = thesis.Advised[i].Institution.acronym;
                } else {
                    adv_item.institution = thesis.Advised[i].organization;
                }
                adv_item.organization = thesis.Advised[i].organization;
                adv_item.username = thesis.Advised[i].username;
                adv_item.email = thesis.Advised[i].email;
                item.advisors.push(adv_item);
            }
            return item;
        });
        callback(tdata);
    }).catch(logger.error);
}

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
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/notify/committees', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                get_committees_period(1, function(data) {
                    Model.NotificationGroup.create({
                        type: 'notify_committee',
                        start: Date(),
                        states: 'pending',
                        fromUserUsername: req.user.username,
                        expectedNotifications: data.length
                    }).then(function(group) {
                        if (group) {
                            for(var i = 0; i<data.length; i++) {
                                send_committee_notifications(data[i], group,
                                    function(g) {
                                        updateGroupStatus(group);
                                    },function(err) {
                                        closeGroupWithError(group, err);
                                    });
                            }
                            res.render('communication', {page_name: 'communication', user: req.user, message_ok: 'Notifications sent'});
                        } else {
                            res.render('communication', {page_name: 'communication', user: req.user, message_error: 'Error creating the notification group'});
                        }
                    }).catch(function (err) {
                        res.render('communication', {page_name: 'communication', user: req.user, message_error: 'Error creating the notification group'});
                    });
                });
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/notify/advisors', function (req, res) {
    if (!req.isAuthenticated()) {

        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});


router.get('/notify/learners', function (req, res) {
    if (!req.isAuthenticated()) {

        res.redirect('/auth/signin');
    } else {
        if (req.secure) {
            if (!req.user.admin) {
                res.status(401);
                res.render('error', { message: 'Unauthorized access', error: {}});
            } else {
                res.render('communication', {page_name: 'communication', user: req.user});
            }
        } else {
            // request was via http, so redirect to https
            res.redirect('https://' + get_host_https(req) + req.originalUrl);
        }
    }
});

router.get('/notifications', function (req, res) {
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
            Model.NotificationGroup.findAll({
                attributes: ['id', 'type', 'start', 'end', 'states'],
                where: {NotificationGroupId: null},
                include: [
                    {
                        model: Model.User,
                        as: 'from_user',
                        attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                        include:[
                            {
                                model: Model.Institution,
                                attributes: ['acronym', 'name'],
                                required: false
                            }
                        ]
                    },
                    {
                        model: Model.NotificationGroup,
                        as: 'Children',
                        attributes: ['id', 'type', 'start', 'end', 'states'],
                        required: false,
                        include: [
                            {
                                model: Model.User,
                                as: 'from_user',
                                attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                                include:[
                                    {
                                        model: Model.Institution,
                                        attributes: ['acronym', 'name'],
                                        required: false
                                    }
                                ]
                            },
                            {
                                model: Model.Notification,
                                attributes: ['id', 'type', 'start', 'end', 'states'],
                                required: false
                            },
                        ]
                    },
                    {
                        model: Model.Notification,
                        attributes: ['id', 'type', 'start', 'end', 'states'],
                        required: false
                    },
                ],
                order:[
                    ["createdAt","DESC"]
                ],
                subQuery: false
            }).then(function(data) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering notifications' }, null, 3));
            });
        }
    }
});


module.exports = router;