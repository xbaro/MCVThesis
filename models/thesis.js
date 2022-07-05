"use strict";

var models = require('./index')

module.exports = function(sequelize, DataTypes) {
    var Thesis = sequelize.define("Thesis", {
        title: DataTypes.STRING,
        abstract: DataTypes.TEXT,
        keywords: DataTypes.STRING,
        approved: DataTypes.BOOLEAN,
        order: DataTypes.INTEGER,
        nda: DataTypes.BOOLEAN,
        virtual_room: DataTypes.STRING,
        rubrics_folder: DataTypes.STRING,
        report_url: DataTypes.STRING
    });

    //Thesis.hasMany(models.User, {as: 'Advisors'})

    return Thesis;
};

