'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "ThesisId" to table "NotificationGroups"
 *
 **/

var info = {
    "revision": 10,
    "name": "link_notification_theses",
    "created": "2019-09-13T11:30:36.855Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "NotificationGroups",
        "ThesisId",
        {
            "type": Sequelize.INTEGER,
            "field": "ThesisId",
            "onUpdate": "CASCADE",
            "onDelete": "SET NULL",
            "references": {
                "model": "Theses",
                "key": "id"
            },
            "allowNull": true
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
