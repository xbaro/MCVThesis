"use strict";

module.exports = function(sequelize, DataTypes) {
    var Slot = sequelize.define("Slot", {
        place:  DataTypes.STRING,
        start: DataTypes.DATE,
        end: DataTypes.DATE,
        capacity: DataTypes.INTEGER,
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

