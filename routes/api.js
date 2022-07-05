var express = require('express');
var router = express.Router();
var Model = require('../models');
const jwt = require('jsonwebtoken');
const password_gen = require('secure-random-password');
const bcrypt = require("bcrypt");
const saltRounds = 10;

function check_credentials(client, secret) {
    const client_mcv = process.env.MCV_WEB_CLIENT;
    const secret_mcv = process.env.MCV_WEB_SECRET;

    return client === client_mcv && secret === secret_mcv
}

function generate_token(client) {
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    const data = {
        scope: 'api',
        sub: client,
    }

    return jwt.sign(data, jwtSecretKey);
}

function get_token_data(req) {
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let verification = {};

    try {
        const token = req.header(tokenHeaderKey);
        const verified = jwt.verify(token, jwtSecretKey);

        if(verified) {
            verification = {
                valid: true,
                data: verified
            }
        } else {
            // Access Denied
            verification = {
                valid: false,
                error: error,
            }
        }
    } catch (error) {
        // Access Denied
        verification = {
            valid: false,
            error: error,
        }
    }

    return verification
}

function validate_request(req) {
    const verification_data = get_token_data(req);
    return verification_data['valid'];
}

/* Generate a token */
router.post('/token', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    // Check credentials provided in body
    const { client, secret } = req.body;
    if (!check_credentials(client, secret)) {
        res.status(401);
        res.send(JSON.stringify({
            error: 'Invalid credentials'
        }, null, 3));
    } else {
        res.status(200);
        res.send(JSON.stringify({
            token: generate_token(client)
        }, null, 3));
    }
});

/* GET institutions. */
router.get('/institutions', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if(!validate_request(req)) {
        res.status(401);
        res.send(JSON.stringify({
            error: 'Invalid credentials'
        }, null, 3));
    } else {
        Model.Institution.findAll({
            attributes: ['id', 'acronym', 'name'],
        }).then(function(result_data) {
            res.status(200);
            res.send(JSON.stringify(result_data, null, 3));
        });
    }
});

/* GET teachers. */
router.get('/teachers', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if(!validate_request(req)) {
        res.status(401);
        res.send(JSON.stringify({
            error: 'Invalid credentials'
        }, null, 3));
    } else {
        Model.User.findAll({
            attributes: ['username', 'name', 'surname', 'email', 'organization', 'webpage', 'keywords'],
            include: [
                {
                    model: Model.Institution,
                    attributes: ['id', 'acronym', 'name'],
                }],
            where: {
                teacher: true
            }
        }).then(function(result_data) {
            res.status(200);
            res.send(JSON.stringify(result_data, null, 3));
        });
    }
});

/* POST learner. */
router.post('/learner', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if(!validate_request(req)) {
        res.status(401);
        res.send(JSON.stringify({
            error: 'Invalid credentials'
        }, null, 3));
    } else {
        var new_password = password_gen.randomPassword({characters: [password_gen.lower, password_gen.upper, password_gen.digits, password_gen.symbols] });
        Model.User.create({
            username: req.body.username,
            name: req.body.name,
            surname: req.body.surname,
            email: req.body.email,
            password: bcrypt.hashSync(new_password, saltRounds),
        }).then(function(result_data) {
            let new_obj = result_data.dataValues;
            delete new_obj['password'];
            new_obj['roles'] = result_data.roles;
            res.status(200);
            res.send(JSON.stringify(new_obj, null, 3));
        }).catch(function(error) {
            res.status(400);
            res.send(JSON.stringify({errors: error.errors}, null, 3));
        });
    }
});

/* GET theses. */
router.get('/theses', function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if(!validate_request(req)) {
        res.status(401);
        res.send(JSON.stringify({
            error: 'Invalid credentials'
        }, null, 3));
    } else {
        let query = {
            attributes: ['id', 'title', 'abstract', 'keywords', 'approved'],
            include: [
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name'],
                    required: true,
                },
                {
                    model: Model.User,
                    attributes: ['username', 'name', 'surname', 'full_name', 'organization'],
                    as: "Advised",
                    required: false,
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
        if(req.query.year) {
            query.where = {
                createdAt: {
                    '$between': [req.query.year + '-01-01T00:00:00.000z', req.query.year + '-12-31T23:59:59.000z']
                }
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
            res.send(JSON.stringify({ error: true, message: 'Error recovering theses' }, null, 3));
        });
    }
});

/* POST theses. */
router.post('/theses', async function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    if(!validate_request(req)) {
        res.status(401);
        res.send(JSON.stringify({
            error: 'Invalid credentials'
        }, null, 3));
    } else {
        const thesis = await  Model.Thesis.create({
            title: req.body.title,
            abstract: req.body.abstract,
            keywords: req.body.keywords,
            approved: true,
            UserUsername: req.body.author,
        });

        req.body.advisors.forEach(async function(advisor) {
            const advisor_user = await Model.User.findOne({where: {username: advisor.username}})
            const new_Advisor = await thesis.addAdvised(advisor_user);
            var a=4;
        });

        res.status(200);
        res.send(JSON.stringify(thesis, null, 3));
    }
});

module.exports = router;
