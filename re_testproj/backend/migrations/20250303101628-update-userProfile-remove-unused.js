'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove unnecessary fields
    await queryInterface.removeColumn('userProfile', 'cardholderName');
    await queryInterface.removeColumn('userProfile', 'billingAddress');
    await queryInterface.removeColumn('userProfile', 'billingZipCode');

    // Add `bankName` to store selected bank
    await queryInterface.addColumn('userProfile', 'bankName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes
    await queryInterface.addColumn('userProfile', 'cardholderName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'billingAddress', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'billingZipCode', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn('userProfile', 'bankName');
  },
};