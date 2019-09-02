"use strict";

var models = require('./index')

module.exports = function(sequelize, DataTypes) {
    var Thesis = sequelize.define("Thesis", {
        title: DataTypes.STRING,
        abstract: DataTypes.TEXT,
        keywords: DataTypes.STRING,
        approved: DataTypes.BOOLEAN,
        order: DataTypes.INTEGER,
        nda: DataTypes.BOOLEAN
    });

    //Thesis.hasMany(models.User, {as: 'Advisors'})

    return Thesis;
};

