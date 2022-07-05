'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

const config = require(path.resolve('./config', 'config.js'))[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    //const model = sequelize['import'](path.join(__dirname, file));
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.User.belongsToMany(db.Thesis, { through: 'Advisors', as: 'Advisor'});
db.Advised = db.Thesis.belongsToMany(db.User, { through: 'Advisors', as: 'Advised'});

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

db.Institution.hasMany(db.User);
db.User.belongsTo(db.Institution);

db.User.hasMany(db.Track, {onDelete: 'CASCADE'});

db.Notification.belongsTo(db.User, {onDelete: 'CASCADE', as: 'to_user'});
db.Notification.belongsTo(db.User, {onDelete: 'SET NULL', as: 'from_user'});

db.NotificationGroup.hasMany(db.Notification);
db.Notification.belongsTo(db.NotificationGroup, {onDelete: 'SET NULL'});


db.NotificationGroup.hasOne(db.NotificationGroup, {onDelete: 'SET NULL', as: 'Parent'});
db.NotificationGroup.belongsTo(db.Thesis, {onDelete: 'SET NULL'});
db.NotificationGroup.hasMany(db.NotificationGroup, {as: 'Children'});
db.NotificationGroup.belongsTo(db.User, {onDelete: 'SET NULL', as: 'from_user'});

db.User.hasOne(db.Consent, {onDelete: 'SET NULL'});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

db.getUserConsent = function(user, create=false) {
  return db.Consent.findOne({ where: {
    UserUsername: user.username,
  }}).then(function (result) {
    if (result == null) {
      if (create) {
        return db.Consent.create({
          UserUsername: user.username,
          accepted: Date.now()
        }).then(function (consent) {
          return {created: true, consent: consent}
        });
      } else {
        return {created: false, consent: null}
      }
    } else {
      return {created: false, consent: result}
    }
  });
}

module.exports = db;
