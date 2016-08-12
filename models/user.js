"use strict";

module.exports = function(sequelize, DataTypes) {
    var User = sequelize.define("User", {
        username: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        name:  DataTypes.STRING,
        surname:  DataTypes.STRING,
        password:  DataTypes.STRING,
        admin: DataTypes.BOOLEAN,
        teacher: DataTypes.BOOLEAN,
        email: DataTypes.STRING,
        organization: DataTypes.STRING,
        webpage: DataTypes.STRING,
        keywords: DataTypes.TEXT,
        roles: DataTypes.VIRTUAL
    },
    {
        getterMethods: {
            roles: function () {
                var roles = '';
                if (this.getDataValue('admin')) {
                    if (roles.length > 0) roles += ', ';
                    roles += 'admin'
                }
                if (this.getDataValue('teacher')) {
                    if (roles.length > 0) roles += ', ';
                    roles += 'teacher'
                }
                return roles;
            }
        }
    });

    return User;
};

