'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Client extends Model {
    static associate(models) {
      Client.hasMany(models.Message,
         { foreignKey: 'clientId', as: 'Messages' });
      Client.hasMany(models.Debt, { foreignKey: 'clientId', as: 'Debts' });
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