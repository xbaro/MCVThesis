"use strict";

module.exports = function(sequelize, DataTypes) {
    var Slot = sequelize.define("Slot", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        place:  DataTypes.STRING,
        room:  DataTypes.STRING,
        start: DataTypes.DATE,
        end: DataTypes.DATE,
        capacity: DataTypes.INTEGER,
        duration: DataTypes.INTEGER,
        full: DataTypes.VIRTUAL
    },
    {
        getterMethods: {
            full: function () {
                return false;
            }
        }
    });

    return Slot;
};

