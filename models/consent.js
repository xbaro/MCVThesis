"use strict";

module.exports = function(sequelize, DataTypes) {
    var Consent = sequelize.define("Consent", {
        accepted: DataTypes.DATE,
        hash: DataTypes.STRING,
    });

    return Consent;
};
