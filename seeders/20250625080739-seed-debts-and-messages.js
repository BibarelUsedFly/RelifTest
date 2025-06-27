'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Sacamos los ID de Zeus y Hades
    /* Para la prueba quiero tener a Zeus con deuda 
       y a Hades con mensajes viejos */
    const [clients] = await queryInterface.sequelize.query(`SELECT id, name FROM "Clients"`);
    const zeus = clients.find(c => c.name === 'Zeus');
    const hades = clients.find(c => c.name === 'Hades');
    const now = new Date();

    // Deudas para Zeus
    await queryInterface.bulkInsert('Debts', [
      {
        institution: 'BancoEstado',
        amount: 300,
        dueDate: new Date('1970-01-01'),
        clientId: zeus.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        institution: 'Banco Olimpo',
        amount: 999999,
        dueDate: new Date('2025-10-01'),
        clientId: zeus.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        institution: 'Banco de Chile',
        amount: 100000,
        dueDate: new Date('2025-01-01'),
        clientId: zeus.id,
        createdAt: now,
        updatedAt: now,
      }
    ]);

    // Mensajes para Hades
    await queryInterface.bulkInsert('Messages', [
      {
        text: 'Hola?',
        role: 'client',
        sentAt: new Date('2024-03-15'),
        clientId: hades.id,
        createdAt: now,
        updatedAt: now,
      },
      {
        text: 'Holaaa?',
        role: 'client',
        sentAt: new Date('2024-06-10'),
        clientId: hades.id,
        createdAt: now,
        updatedAt: now,
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Debts', null, {});
    await queryInterface.bulkDelete('Messages', null, {});
  }
};

