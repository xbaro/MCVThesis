"use strict";

module.exports = function(sequelize, DataTypes) {
    var Config = sequelize.define("Config", {
        students_create:  {type: DataTypes.BOOLEAN, defaultValue: false},
        students_delete:  {type: DataTypes.BOOLEAN, defaultValue: false},
        students_edit:  {type: DataTypes.BOOLEAN, defaultValue: false}
    });

    return Config;
};