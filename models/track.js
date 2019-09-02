"use strict";

module.exports = function(sequelize, DataTypes) {
    var Track = sequelize.define("Track", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        title:  DataTypes.STRING,
        keywords: DataTypes.STRING
    });

    return Track;
};

