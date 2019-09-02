"use strict";

module.exports = function(sequelize, DataTypes) {
    var Institution = sequelize.define("Institution", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        acronym:  {
            type: DataTypes.STRING,
            unique: true
        },
        name: DataTypes.STRING,
        validated: DataTypes.BOOLEAN
    });

    return Institution;
};

