'use strict';

var Sequelize = require('sequelize');

/**
 * Actions summary:
 *
 * createTable "Institutions", deps: []
 * addColumn "InstitutionId" to table "Users"
 *
 **/

var info = {
    "revision": 2,
    "name": "add_institutions",
    "created": "2019-09-02T15:55:08.029Z",
    "comment": ""
};

var migrationCommands = [{
        fn: "createTable",
        params: [
            "Institutions",
            {
                "id": {
                    "type": Sequelize.INTEGER,
                    "field": "id",
                    "autoIncrement": true,
                    "unique": true,
                    "primaryKey": true
                },
                "acronym": {
                    "type": Sequelize.STRING,
                    "field": "acronym",
                    "unique": true
                },
                "name": {
                    "type": Sequelize.STRING,
                    "field": "name"
                },
                "validated": {
                    "type": Sequelize.BOOLEAN,
                    "field": "validated"
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
            "InstitutionId",
            {
                "type": Sequelize.INTEGER,
                "field": "InstitutionId",
                "onUpdate": "CASCADE",
                "onDelete": "SET NULL",
                "references": {
                    "model": "Institutions",
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
