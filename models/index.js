'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

const config = require(path.resolve('./config', 'config.js'))[env];
const db = {};

let sequelize;
sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
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

db.User.belongsTo(db.Institution);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
