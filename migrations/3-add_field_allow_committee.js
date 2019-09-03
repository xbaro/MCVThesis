'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * addColumn "allow_committee" to table "Periods"
 *
 **/

var info = {
    "revision": 3,
    "name": "add_field_allow_committee",
    "created": "2019-09-03T16:07:24.012Z",
    "comment": ""
};

var migrationCommands = [{
    fn: "addColumn",
    params: [
        "Periods",
        "allow_committee",
        {
            "type": Sequelize.BOOLEAN,
            "field": "allow_committee"
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
