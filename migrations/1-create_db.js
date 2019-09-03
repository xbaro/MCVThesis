'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Configs", deps: []
 * createTable "Periods", deps: []
 * createTable "Users", deps: []
 * createTable "Tracks", deps: [Periods]
 * createTable "Slots", deps: [Tracks]
 * createTable "Theses", deps: [Users, Slots]
 * createTable "Committees", deps: [Users, Theses]
 * createTable "Advisors", deps: [Users, Theses]
 *
 **/

var info = {
    "revision": 1,
    "name": "create_db",
    "created": "2019-09-02T15:53:43.693Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "Configs",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "students_create": {
                    "type": Sequelize.BOOLEAN,
                    "field": "students_create",
                    "defaultValue": false
                },
                "students_delete": {
                    "type": Sequelize.BOOLEAN,
                    "field": "students_delete",
                    "defaultValue": false
                },
                "students_edit": {
                    "type": Sequelize.BOOLEAN,
                    "field": "students_edit",
                    "defaultValue": false
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Periods",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "unique": true,
                    "primaryKey": true
                },
                "title": {
                    "type": Sequelize.STRING,
                    "field": "title"
                },
                "start": {
                    "type": Sequelize.DATE,
                    "field": "start"
                },
                "end": {
                    "type": Sequelize.DATE,
                    "field": "end"
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Users",
            {
                "username": {
                    "type": Sequelize.STRING,
                    "field": "username",
                    "primaryKey": true
                },
                "name": {
                    "type": Sequelize.STRING,
                    "field": "name"
                },
                "surname": {
                    "type": Sequelize.STRING,
                    "field": "surname"
                },
                "password": {
                    "type": Sequelize.STRING,
                    "field": "password"
                },
                "admin": {
                    "type": Sequelize.BOOLEAN,
                    "field": "admin",
                    "defaultValue": false
                },
                "teacher": {
                    "type": Sequelize.BOOLEAN,
                    "field": "teacher",
                    "defaultValue": false
                },
                "email": {
                    "type": Sequelize.STRING,
                    "field": "email"
                },
                "organization": {
                    "type": Sequelize.STRING,
                    "field": "organization"
                },
                "webpage": {
                    "type": Sequelize.STRING,
                    "field": "webpage"
                },
                "keywords": {
                    "type": Sequelize.TEXT,
                    "field": "keywords"
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Tracks",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "unique": true,
                    "primaryKey": true
                },
                "title": {
                    "type": Sequelize.STRING,
                    "field": "title"
                },
                "keywords": {
                    "type": Sequelize.STRING,
                    "field": "keywords"
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                },
                "PeriodId": {
                    "type": Sequelize.INTEGER,
                    "field": "PeriodId",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "Periods",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Slots",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "unique": true,
                    "primaryKey": true
                },
                "place": {
                    "type": Sequelize.STRING,
                    "field": "place"
                },
                "room": {
                    "type": Sequelize.STRING,
                    "field": "room"
                },
                "start": {
                    "type": Sequelize.DATE,
                    "field": "start"
                },
                "end": {
                    "type": Sequelize.DATE,
                    "field": "end"
                },
                "capacity": {
                    "type": Sequelize.INTEGER,
                    "field": "capacity"
                },
                "duration": {
                    "type": Sequelize.INTEGER,
                    "field": "duration"
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                },
                "TrackId": {
                    "type": Sequelize.INTEGER,
                    "field": "TrackId",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "Tracks",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Theses",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "title": {
                    "type": Sequelize.STRING,
                    "field": "title"
                },
                "abstract": {
                    "type": Sequelize.TEXT,
                    "field": "abstract"
                },
                "keywords": {
                    "type": Sequelize.STRING,
                    "field": "keywords"
                },
                "approved": {
                    "type": Sequelize.BOOLEAN,
                    "field": "approved"
                },
                "order": {
                    "type": Sequelize.INTEGER,
                    "field": "order"
                },
                "nda": {
                    "type": Sequelize.BOOLEAN,
                    "field": "nda"
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                },
                "UserUsername": {
                    "type": Sequelize.STRING,
                    "field": "UserUsername",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Users",
                        "key": "username"
                    },
                    "allowNull": true
                },
                "SlotId": {
                    "type": Sequelize.INTEGER,
                    "field": "SlotId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "Slots",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Committees",
            {
                "president": {
                    "type": Sequelize.BOOLEAN,
                    "field": "president"
                },
                "secretary": {
                    "type": Sequelize.BOOLEAN,
                    "field": "secretary"
                },
                "vocal": {
                    "type": Sequelize.BOOLEAN,
                    "field": "vocal"
                },
                "waiting": {
                    "type": Sequelize.BOOLEAN,
                    "field": "waiting"
                },
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                },
                "UserUsername": {
                    "type": Sequelize.STRING,
                    "allowNull": true,
                    "field": "UserUsername",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "Users",
                        "key": "username"
                    },
                    "primaryKey": true
                },
                "ThesisId": {
                    "type": Sequelize.INTEGER,
                    "allowNull": true,
                    "field": "ThesisId",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "Theses",
                        "key": "id"
                    },
                    "primaryKey": true
                }
            },
            {}
        ]
    },
    {
        fn: "createTable",
        params: [
            "Advisors",
            {
                "createdAt": {
                    "type": Sequelize.DATE,
                    "field": "createdAt",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": Sequelize.DATE,
                    "field": "updatedAt",
                    "allowNull": false
                },
                "UserUsername": {
                    "type": Sequelize.STRING,
                    "field": "UserUsername",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "Users",
                        "key": "username"
                    },
                    "primaryKey": true
                },
                "ThesisId": {
                    "type": Sequelize.INTEGER,
                    "field": "ThesisId",
                    "onUpdate": "CASCADE",
                    "onDelete": "CASCADE",
                    "references": {
                        "model": "Theses",
                        "key": "id"
                    },
                    "primaryKey": true
                }
            },
            {}
        ]
    }
];

module.exports = {
    pos: 0,
    up: function(queryInterface, Sequelize)
    {
        var index = this.pos;
        return new Promise(function(resolve, reject) {
            function next() {
                if (index < migrationCommands.length)
                {
                    let command = migrationCommands[index];
                    console.log("[#"+index+"] execute: " + command.fn);
                    index++;
                    queryInterface[command.fn].apply(queryInterface, command.params).then(next, reject);
                }
                else
                    resolve();
            }
            next();
        });
    },
    info: info
};
