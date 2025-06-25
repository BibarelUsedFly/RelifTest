'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Debt extends Model {
    static associate(models) {
      Debt.belongsTo(models.Client, { foreignKey: 'clientId' });
    }
  }
  Debt.init({
    institution: DataTypes.STRING,
    amount: DataTypes.INTEGER,
    dueDate: DataTypes.DATE,
    clientId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Debt',
  });
  return Debt;
};