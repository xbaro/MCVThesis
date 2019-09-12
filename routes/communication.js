var express = require('express');
var router = express.Router();
var Model = require('../models');
const Email = require('email-templates');
var transport = require('../lib/mail');
const path = require('path');
const logger = require('../logger');
const moment = require('moment');
const XLSX = require('xlsx');
const excel = require('exceljs');

const email_templates = {
    notify_committee: [ new Email({
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
    }), 'committees'],
    notify_advisor: [new Email({
        message: {
            from: 'noreply@mcv.eimt.uoc.edu',
            attachments: [
                {
                    filename: 'EvaluationGuidelinesAdvisorEN.doc',
                    path: path.normalize(path.join(__dirname, '..', 'emails', 'advisors', 'EvaluationGuidelinesAdvisorEN.doc'))
                }
            ],
        },
        send: true,
        transport: transport
    }), 'advisors'],
    notify_learner: [new Email({
        message: {
            from: 'noreply@mcv.eimt.uoc.edu',
        },
        send: true,
        transport: transport
    }), 'learners'],
};

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
            var num_failed = 0;

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
                                id: data[0].id
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
                                id: data[0].id
                            }
                        }).then(error).catch(error);
                }
            }
        }
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

function get_mail_locals(data) {
    var advisors = '';
    for(var i=0; i<data.advisors.length; i++) {
        if (i>0) {
            advisors += ', ';
        }
        advisors += `${data.advisors[i].name} (${data.advisors[i].institution}) <${data.advisors[i].email}>`;
    }
    return {
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
}

function send_mail(type, member, group, data, callback, error) {
    Model.Notification.create({
        type: type,
        data: JSON.stringify(data),
        NotificationGroupId: group.id,
        start: Date(),
        states: 'pending',
        fromUserUsername: group.fromUserUsername,
        toUserUsername: member.username
    }).then(function(notification) {

        if (notification) {
            email_templates[type][0]
                .send({
                    template: email_templates[type][1],
                    message: {
                        to: `${member.full_name} <${member.email}>`,
                    },
                    locals: get_mail_locals(data)
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

function send_notifications(type, data, group, callback, error) {
    if (type === "notify_learner") {
        var learner = {

        };
        send_mail(type, data.author, group, data,
            function (notification) {
                updateGroupStatus(group, callback, error);
            }, function (err) {
                closeGroupWithError(group, err);
                if (error) {
                    error(err);
                }
            });
    } else {
        Model.NotificationGroup.create({
            type: type,
            NotificationGroupId: group.id,
            start: Date(),
            states: 'pending',
            fromUserUsername: group.fromUserUsername,
            expectedNotifications: 3
        }).then(function (subgroup) {
            if (subgroup) {
                if (type === "notify_committee") {
                    send_mail(type, data.committee.president, subgroup, data,
                        function (notification) {
                            updateGroupStatus(subgroup, callback, error);
                        }, function (err) {
                            closeGroupWithError(subgroup, err);
                            if (error) {
                                error(err);
                            }
                        });
                    send_mail(type, data.committee.secretary, subgroup, data,
                        function (notification) {
                            updateGroupStatus(subgroup, callback, error);
                        }, function (err) {
                            closeGroupWithError(subgroup, err);
                            if (error) {
                                error(err);
                            }
                        });
                    send_mail(type, data.committee.vocal, subgroup, data,
                        function (notification) {
                            updateGroupStatus(subgroup, callback, error);
                        }, function (err) {
                            closeGroupWithError(subgroup, err);
                            if (error) {
                                error(err);
                            }
                        });
                } else if (type === "notify_advisor") {
                    for (var i = 0; i < data.advisors.length; i++) {
                        send_mail(type, data.advisors[i], subgroup, data,
                            function (notification) {
                                updateGroupStatus(subgroup, callback, error);
                            }, function (err) {
                                closeGroupWithError(subgroup, err);
                                if (error) {
                                    error(err);
                                }
                            });
                    }
                }
            } else {
                if (error) {
                    error(err);
                }
            }
        }).catch(function (err) {
            if (error) {
                error(err);
            }
        });
    }
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
                                required: true,
                                where: {
                                    id: periodId
                                }
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
                item.author = null;
                item.thesis_author_name = null;
                item.thesis_author_username = null;
                item.thesis_author_email = null;
            } else {
                item.author = {
                    name: thesis.User.full_name,
                    email: thesis.User.email,
                    username: thesis.User.username,
                    organization: null,
                    institution: null
                };
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
            item.committee_html = '<ul>';
            item.committee_html += '<li><b>President:</b> ' + item.committee.president.name + '(' + item.committee.president.institution + ')</li>';
            item.committee_html += '<li><b>Secretary:</b> ' + item.committee.secretary.name + '(' + item.committee.secretary.institution + ')</li>';
            item.committee_html += '<li><b>Vocal:</b> ' + item.committee.vocal.name + '(' + item.committee.vocal.institution + ')</li>';
            item.committee_html += '</ul>';
            item.committee_txt = '\t- President: ' + item.committee.president.name + '(' + item.committee.president.institution + ')\n';
            item.committee_txt += '\t- Secretary: ' + item.committee.secretary.name + '(' + item.committee.secretary.institution + ')\n';
            item.committee_txt += '\t- Vocal: ' + item.committee.vocal.name + '(' + item.committee.vocal.institution + ')';

            item.advisors_html = '<ul>';
            item.advisors_txt = '';
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
                item.advisors_html += '<li>' + adv_item.name + '(' + adv_item.institution + ')</li>';
                item.advisors_txt += '\t- ' + adv_item.name + '(' + adv_item.institution + ')\n';
            }
            item.advisors_html += '</ul>';
            return item;
        });
        callback(tdata);
    }).catch(logger.error);
}

function get_active_period(callback, error) {
    Model.Period.findAll({
        attributes: ['id', 'title', 'locked', 'start', 'end', 'active', 'closed'],
        where: {
            $or: [
                {
                    start: null,
                },
                {
                    start: {
                        $lte: new Date()
                    }
                }
            ],
            $or: [
                {
                    end: null,
                },
                {
                    end: {
                        $gte: new Date()
                    }
                }
            ]
        }
    }).then(callback).catch(error)
}

function send_committee_notifications(period_id, type, user, callback, error) {
    get_active_period(function(period_data) {
        if(period_data) {
            get_committees_period(period_id, function (data) {
                Model.NotificationGroup.create({
                    type: type,
                    start: Date(),
                    states: 'pending',
                    fromUserUsername: user.username,
                    expectedNotifications: data.length
                }).then(function (group) {
                    if (group) {
                        for (var i = 0; i < data.length; i++) {
                            send_notifications(type, data[i], group,
                                function (g) {
                                    updateGroupStatus(group);
                                }, function (err) {
                                    closeGroupWithError(group, err);
                                });
                        }
                        if (callback) {
                            callback(group);
                        }
                    } else {
                        if (error) {
                            error('Error creating the notification group');
                        }
                    }
                }).catch(error);
            });
        } else {
            if (error) {
                error('No active periods');
            }
        }
    }, error);
}

router.get('/', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            get_active_period(function(data) {
                let period_id = null;
                if (data && data.length === 1) {
                    period_id = data[0].id;
                }
                res.render('communication', {page_name: 'communication', user: req.user, period: JSON.stringify(data), period_id: period_id});
            }, function(error) {
                res.render('communication', {page_name: 'communication', user: req.user, message_error: error});
            });
        }
    }
});

router.get('/export', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            get_active_period(function(data) {
                let period_id = null;
                if (data && data.length === 1) {
                    period_id = data[0].id;
                    get_committees_period(period_id, function(theses) {
                        let workbook = new excel.Workbook(); //creating workbook
                        let worksheet = workbook.addWorksheet('Committees'); //creating worksheet

                        //  WorkSheet Header
                        worksheet.columns = [
                            { header: 'Author', key: 'thesis_author_name', width: 15 },
                            { header: 'Title', key: 'thesis_title', width: 30 },
                            { header: 'Abstract', key: 'thesis_abstract', width: 30},
                            { header: 'Advisors', key: 'advisors_txt', width: 15},
                            { header: 'Committee', key: 'committee_txt', width: 15},
                        ];

                        // Add Array Rows
                        worksheet.addRows(theses);

                        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                        res.setHeader('Content-Disposition', 'attachment; filename=' + 'committees.xlsx');

                        return workbook.xlsx.write(res)
                              .then(function() {
                                    res.status(200).end();
                              });
                    });
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({ error: true, message: 'Multiple active periods' }, null, 3));
                }

            }, function(error) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: error }, null, 3));
            });
        }
    }
});

router.get('/notify/committees/:periodId', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            var periodId = req.params.periodId;
            send_committee_notifications(periodId, 'notify_committee', req.user,
                function(group) {
                    res.render('communication', {page_name: 'communication', user: req.user, message_ok: 'Notifications sent'});
                }, function(err) {
                    res.render('communication', {page_name: 'communication', user: req.user, message_error: 'Error creating the notification group'});
                });
        }
    }
});

router.get('/notify/advisors/:periodId', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            var periodId = req.params.periodId;
            send_committee_notifications(periodId, 'notify_advisor', req.user,
                function(group) {
                    res.render('communication', {page_name: 'communication', user: req.user, message_ok: 'Notifications sent'});
                }, function(err) {
                    res.render('communication', {page_name: 'communication', user: req.user, message_error: 'Error creating the notification group'});
                });
        }
    }
});


router.get('/notify/learners/:periodId', function (req, res) {
    if (!req.isAuthenticated()) {
        res.redirect('/auth/signin');
    } else {
        if (!req.user.admin) {
            res.status(401);
            res.render('error', { message: 'Unauthorized access', error: {}});
        } else {
            var periodId = req.params.periodId;
            send_committee_notifications(periodId, 'notify_learner', req.user,
                function(group) {
                    res.render('communication', {page_name: 'communication', user: req.user, message_ok: 'Notifications sent'});
                }, function(err) {
                    res.render('communication', {page_name: 'communication', user: req.user, message_error: 'Error creating the notification group'});
                });
        }
    }
});

router.get('/notifications/:periodId', function (req, res) {
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
            // TODO: Filter by period
            var periodId = req.params.periodId;
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

router.get('/notification/:id/render', function (req, res) {
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
            var notificationId = req.params.id;
            Model.Notification.findAll({
                attributes: ['id', 'type', 'start', 'end', 'states', 'data'],
                where: {id: notificationId}
            }).then(function(data) {
                if(data && data.length === 1) {
                    email_templates[data[0].type][0]
                        .render(`${email_templates[data[0].type][1]}/html`, get_mail_locals(JSON.parse(data[0].data)))
                        .then(function (value) {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({error: false, html: value}));
                        })
                        .catch(function (err) {
                            res.setHeader('Content-Type', 'application/json');
                            res.send(JSON.stringify({error: true, message: 'err'}, null, 3));
                        });
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify({error: true, message: 'Multiple notifications retrieved'}, null, 3));
                }
            }).catch(function (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ error: true, message: 'Error recovering notifications' }, null, 3));
            });
        }
    }
});


module.exports = router;