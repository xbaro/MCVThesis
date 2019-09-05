'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "expectedNotifications" to table "NotificationGroups"
 *
 **/

var info = {
    "revision": 8,
    "name": "add_ExpectedNotifications_column",
    "created": "2019-09-04T14:45:43.050Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "NotificationGroups",
        "expectedNotifications",
        {
            "type": Sequelize.INTEGER,
            "field": "expectedNotifications"
        }
    ]
}];

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
