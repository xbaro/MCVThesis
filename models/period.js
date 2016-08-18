"use strict";

module.exports = function(sequelize, DataTypes) {
    var Period = sequelize.define("Period", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        title:  DataTypes.STRING,
        start: DataTypes.DATE,
        end: DataTypes.DATE,
        active: DataTypes.VIRTUAL,
        closed: DataTypes.VIRTUAL
    },
    {
        getterMethods: {
            active: function () {
                var now = new Date();

                if(this.getDataValue('start') && this.getDataValue('start')>=now) {
                    return false;
                }

                if(this.getDataValue('end') && this.getDataValue('end')<=now) {
                    return false;
                }

                return true;
            },
            closed: function () {
                var now = new Date();

                if(this.getDataValue('end') && this.getDataValue('end')<=now) {
                    return true;
                }

                return false;
            }
        }
    });

    return Period;
};

