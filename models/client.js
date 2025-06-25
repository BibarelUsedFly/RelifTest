'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      Client.hasMany(models.Message, { foreignKey: 'clientId' });
      Client.hasMany(models.Debt, { foreignKey: 'clientId' });
    }
  }
  Client.init({
    name: DataTypes.STRING,
    rut: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Client',
  });
  return Client;
};