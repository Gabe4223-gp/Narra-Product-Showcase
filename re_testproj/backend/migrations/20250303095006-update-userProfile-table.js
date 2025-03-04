'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('userProfile', 'cardNumber');
    await queryInterface.removeColumn('userProfile', 'expiryDate');
    await queryInterface.removeColumn('userProfile', 'cvv');
    await queryInterface.removeColumn('userProfile', 'bank');
    await queryInterface.removeColumn('userProfile', 'accountNumber');
    await queryInterface.removeColumn('userProfile', 'accountName');
    await queryInterface.removeColumn('userProfile', 'routingNumber');

    await queryInterface.addColumn('userProfile', 'storedPaymentMethods', {
      type: Sequelize.JSONB,
      allowNull: true,
    });

    await queryInterface.addColumn('userProfile', 'preferredPaymentMethod', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('userProfile', 'landlordBankId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('userProfile', 'storedPaymentMethods');
    await queryInterface.removeColumn('userProfile', 'preferredPaymentMethod');
    await queryInterface.removeColumn('userProfile', 'landlordBankId');

    await queryInterface.addColumn('userProfile', 'cardNumber', {
      type: Sequelize.STRING(19),
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'expiryDate', {
      type: Sequelize.STRING(7),
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'cvv', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'bank', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'accountNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'accountName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('userProfile', 'routingNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};