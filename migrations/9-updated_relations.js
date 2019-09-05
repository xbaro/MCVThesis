'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "GroupId" from table "Notifications"
 * addColumn "NotificationGroupId" to table "Notifications"
 *
 **/

var info = {
    "revision": 9,
    "name": "updated_relations",
    "created": "2019-09-04T16:46:41.722Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "removeColumn",
        params: ["Notifications", "GroupId"]
    },
    {
        fn: "addColumn",
        params: [
            "Notifications",
            "NotificationGroupId",
            {
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
