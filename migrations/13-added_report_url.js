'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Consents", deps: [Users]
 * addColumn "report_url" to table "Theses"
 *
 **/

var info = {
    "revision": 13,
    "name": "added_report_url",
    "created": "2022-07-05T19:27:05.585Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "Consents",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "primaryKey": true,
                    "allowNull": false
                },
                "accepted": {
                    "type": Sequelize.DATE,
                    "field": "accepted"
                },
                "hash": {
                    "type": Sequelize.STRING,
                    "field": "hash"
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
                }
            },
            {}
        ]
    },
    {
        fn: "addColumn",
        params: [
            "Theses",
            "report_url",
            {
                "type": Sequelize.STRING,
                "field": "report_url"
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
