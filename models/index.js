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

//db.User.hasMany(db.Thesis, {as: 'Author'});
//db.User.belongsTo(db.Thesis, { as: 'Author', constraints: false, foreignKey: 'username' });



db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
