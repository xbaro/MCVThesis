'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * removeColumn "allow_committee" from table "Periods"
 * addColumn "locked" to table "Periods"
 *
 **/

var info = {
    "revision": 4,
    "name": "period_change_lock_field_name",
    "created": "2019-09-03T16:28:25.202Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "removeColumn",
        params: ["Periods", "allow_committee"]
    },
    {
        fn: "addColumn",
        params: [
            "Periods",
            "locked",
            {
                "type": Sequelize.BOOLEAN,
                "field": "locked"
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
