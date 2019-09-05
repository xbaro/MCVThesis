"use strict";

module.exports = function(sequelize, DataTypes) {
    var NotificationGroup = sequelize.define("NotificationGroup", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            unique: true,
            autoIncrement: true
        },
        type: {
            type: DataTypes.ENUM,
            values: ['notify_committee', 'notify_advisor', 'notify_learner', 'notify_admin']
        },
        start: DataTypes.DATE,
        end: DataTypes.DATE,
        states: {
            type: DataTypes.ENUM,
            values: ['pending', 'sent', 'failed']
        },
        expectedNotifications: DataTypes.INTEGER
    });

    return NotificationGroup;
};

