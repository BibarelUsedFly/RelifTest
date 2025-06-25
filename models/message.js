'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      Message.belongsTo(models.Client, { foreignKey: 'clientId' });
    }
  }
  Message.init({
    text: DataTypes.STRING,
    role: DataTypes.STRING,
    sentAt: DataTypes.DATE,
    clientId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Message',
  });
  return Message;
};