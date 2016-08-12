"use strict";

module.exports = function(sequelize, DataTypes) {
    var Committee = sequelize.define("Committee", {

        president:  DataTypes.BOOLEAN,
        secretary:  DataTypes.BOOLEAN,
        vocal:  DataTypes.BOOLEAN,
        waiting: DataTypes.BOOLEAN,
        role: DataTypes.VIRTUAL
    },
    {
        getterMethods: {
            role: function () {
                var roles = '';
                if (this.getDataValue('president')) {
                    if (roles.length > 0) roles += ', ';
                    roles += 'president'
                }
                if (this.getDataValue('secretary')) {
                    if (roles.length > 0) roles += ', ';
                    roles += 'secretary'
                }
                if (this.getDataValue('vocal')) {
                    if (roles.length > 0) roles += ', ';
                    roles += 'vocal'
                }
                if (this.getDataValue('waiting')) {
                    if (roles.length > 0) roles += ', ';
                    roles += 'waiting'
                }
                return roles;
            }
        }
    });

    return Committee;
};

