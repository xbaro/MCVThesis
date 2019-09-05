'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "NotificationId" from table "Users"
 * addColumn "fromUserUsername" to table "Notifications"
 * addColumn "toUserUsername" to table "Notifications"
 * addColumn "fromUserUsername" to table "NotificationGroups"
 *
 **/

var info = {
    "revision": 7,
    "name": "update_notification_links",
    "created": "2019-09-04T14:40:54.782Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "removeColumn",
        params: ["Users", "NotificationId"]
    },
    {
        fn: "addColumn",
        params: [
            "Notifications",
            "fromUserUsername",
            {
                "type": Sequelize.STRING,
                "field": "fromUserUsername",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "Users",
                    "key": "username"
                },
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Notifications",
            "toUserUsername",
            {
                "type": Sequelize.STRING,
                "field": "toUserUsername",
                "onUpdate": "CASCADE",
                "onDelete": "CASCADE",
                "references": {
                    "model": "Users",
                    "key": "username"
                },
                "allowNull": true
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "NotificationGroups",
            "fromUserUsername",
            {
                "type": Sequelize.STRING,
                "field": "fromUserUsername",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
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
