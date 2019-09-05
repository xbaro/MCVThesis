'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Notifications", deps: []
 * addColumn "NotificationId" to table "Users"
 * addColumn "UserUsername" to table "Tracks"
 *
 **/

var info = {
    "revision": 5,
    "name": "add_Notification_table",
    "created": "2019-09-04T14:09:59.572Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "Notifications",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "unique": true,
                    "primaryKey": true
                },
                "data": {
                    "type": Sequelize.STRING,
                    "field": "data"
                },
                "type": {
                    "type": Sequelize.ENUM('notify_committee', 'notify_advisor', 'notify_learner', 'notify_admin'),
                    "field": "type"
                },
                "start": {
                    "type": Sequelize.DATE,
                    "field": "start"
                },
                "end": {
                    "type": Sequelize.DATE,
                    "field": "end"
                },
                "states": {
                    "type": Sequelize.ENUM('pending', 'sent', 'failed'),
                    "field": "states"
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
        fn: "addColumn",
        params: [
            "Users",
            "NotificationId",
            {
                "type": Sequelize.INTEGER,
                "field": "NotificationId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "Notifications",
                    "key": "id"
                },
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Tracks",
            "UserUsername",
            {
                "type": Sequelize.STRING,
                "field": "UserUsername",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "Users",
                    "key": "username"
                },
                "allowNull": true
            }
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
