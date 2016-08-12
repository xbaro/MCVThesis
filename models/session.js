"use strict";

module.exports = function(sequelize, DataTypes) {
    var Session = sequelize.define("Session", {
        session_id: 'session_id',
        expires: 'expires',
        data: 'data'
    });

    return Session;
};

