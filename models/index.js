"use strict";

var fs        = require("fs");
var path      = require("path");
var Sequelize = require("sequelize");
var env       = process.env.NODE_ENV || "development";
var config    = require(path.join(__dirname, '..', 'config', 'config.json'))[env];
var sequelize = new Sequelize(config.database, config.username, config.password, config);
var db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
  })
  .forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if ("associate" in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.User.belongsToMany(db.Thesis, { through: 'Advisors', as: 'Advisor'});
db.Thesis.belongsToMany(db.User, { through: 'Advisors', as: 'Advised'});

db.User.belongsToMany(db.Thesis, { through: 'Committee', as:'Committee'});
db.Thesis.belongsToMany(db.User, { through: 'Committee', as:'Reviewed'});

db.User.hasMany(db.Thesis, {as: 'Author'});
db.Thesis.belongsTo(db.User);

db.Period.hasMany(db.Track, {onDelete: 'CASCADE'});
db.Track.belongsTo(db.Period, {onDelete: 'CASCADE'});

db.Track.hasMany(db.Slot, {onDelete: 'CASCADE'});
db.Slot.belongsTo(db.Track, {onDelete: 'CASCADE'});

db.Slot.hasMany(db.Thesis);
db.Thesis.belongsTo(db.Slot);

db.Thesis.hasMany(db.Committee);
db.Committee.belongsTo(db.Thesis);

db.User.hasMany(db.Committee);
db.Committee.belongsTo(db.User);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.getConfigSync = function() {
  var ret_val = null;
  db.Config.findAll().then(function(data) {
    if(data) {
      ret_val = data[0];
    } else {
      db.Config.create().then(function (data) {
        if (data) {
          ret_val = data;
        } else {
          ret_val = {};
        }
      });
    }
  });
  while(!ret_val);

  return ret_val;
};

module.exports = db;
