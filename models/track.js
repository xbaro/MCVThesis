"use strict";

module.exports = function(sequelize, DataTypes) {
    var Track = sequelize.define("Track", {
        title:  DataTypes.STRING,
        keywords: DataTypes.STRING
    });

    return Track;
};

