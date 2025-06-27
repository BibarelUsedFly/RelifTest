'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Clients', [
      { name: 'Zeus', rut: '1.111.111-1', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hades', rut: '2.222.222-2', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Poseidón', rut: '3.333.333-3', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Atenea', rut: '4.444.444-4', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Ares', rut: '5.555.555-5', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Clients', null, {});
  }
};