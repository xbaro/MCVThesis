'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "NotificationGroups", deps: [NotificationGroups]
 * addColumn "GroupId" to table "Notifications"
 *
 **/

var info = {
    "revision": 6,
    "name": "add_NotificationGroup_table",
    "created": "2019-09-04T14:22:42.478Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "NotificationGroups",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "unique": true,
                    "primaryKey": true
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
                },
                "NotificationGroupId": {
                    "type": Sequelize.INTEGER,
                    "field": "NotificationGroupId",
                    "onUpdate": "CASCADE",
                    "onDelete": "SET NULL",
                    "references": {
                        "model": "NotificationGroups",
                        "key": "id"
                    },
                    "allowNull": true
                }
            },
            {}
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Notifications",
            "GroupId",
            {
                "type": Sequelize.INTEGER,
                "field": "GroupId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "NotificationGroups",
                    "key": "id"
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
