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
        admin: {type: DataTypes.BOOLEAN, defaultValue: false},
        teacher: {type: DataTypes.BOOLEAN, defaultValue: false},
        email: DataTypes.STRING,
        organization: DataTypes.STRING,
        webpage: DataTypes.STRING,
        keywords: DataTypes.TEXT,
        roles: DataTypes.VIRTUAL,
        full_name: DataTypes.VIRTUAL,
        student: DataTypes.VIRTUAL
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
                if (roles.length == 0) {
                    roles += 'student'
                }
                return roles;
            },
            full_name: function() {
                return this.getDataValue('name') + ' ' + this.getDataValue('surname');
            },
            student: function() {
                if (this.getDataValue('admin')) {
                    return false;
                }
                if (this.getDataValue('teacher')) {
                    return false;
                }
                return true;
            }
        }
    });

    return User;
};

