"use strict";

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
        username: DataTypes.STRING,
        name:  DataTypes.STRING,
        surname:  DataTypes.STRING,
        password:  DataTypes.STRING,
        admin: DataTypes.BOOLEAN,
        teacher: DataTypes.BOOLEAN,
        email: DataTypes.STRING,
        organization: DataTypes.STRING,
        webpage: DataTypes.STRING,
        keywords: DataTypes.TEXT
    });

    return User;
};

