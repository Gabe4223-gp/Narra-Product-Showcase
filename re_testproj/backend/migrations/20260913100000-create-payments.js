'use strict';

/**
 * Brings the Payments table under migration control.
 *
 * Payments was the one table never covered by a migration: it existed only
 * because Server.js declared an inline Sequelize model and called
 * sequelize.sync() on every boot. That made sync() load-bearing, and left a
 * fresh clone of this repository without the table after running the
 * migrations. This mirrors the inline model exactly so sync() can be removed.
 *
 * Guarded so it is a no-op on databases where sync() already created it.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('Payments')) {
      return; // already created by sync() on existing deployments
    }

    await queryInterface.createTable('Payments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      external_id: { type: Sequelize.STRING, allowNull: true },
      client_id: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      // Stored in centavos.
      amountPaid: { type: Sequelize.INTEGER, allowNull: false },
      totalAmount: { type: Sequelize.INTEGER, allowNull: false },
      dateOfPayment: { type: Sequelize.DATE, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: false },
      invoiceUrl: { type: Sequelize.STRING, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('Payments', ['client_id']);
    await queryInterface.addIndex('Payments', ['dateOfPayment']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Payments');
  },
};
