"use strict";

module.exports = function(sequelize, DataTypes) {
    var Notification = sequelize.define("Notification", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        data: DataTypes.TEXT,
        type: {
            type: DataTypes.ENUM,
            values: ['notify_committee', 'notify_advisor', 'notify_learner', 'notify_admin']
        },
        start: DataTypes.DATE,
        end: DataTypes.DATE,
        states: {
            type: DataTypes.ENUM,
            values: ['pending', 'sent', 'failed']
        }
    });

    return Notification;
};

