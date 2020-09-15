'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "rubrics_folder" to table "Theses"
 * addColumn "virtual_room" to table "Theses"
 *
 **/

var info = {
    "revision": 12,
    "name": "additional_thesis_fields",
    "created": "2020-09-15T16:30:33.934Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "addColumn",
        params: [
            "Theses",
            "rubrics_folder",
            {
                "type": Sequelize.STRING,
                "field": "rubrics_folder"
            }
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Theses",
            "virtual_room",
            {
                "type": Sequelize.STRING,
                "field": "virtual_room"
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
