'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Files', 'landlordCardholderName');
    await queryInterface.removeColumn('Files', 'landlordBillingAddress');
    await queryInterface.removeColumn('Files', 'landlordCardNumber');
    await queryInterface.removeColumn('Files', 'landlordExpiryDate');
    await queryInterface.removeColumn('Files', 'landlordCvv');
    await queryInterface.removeColumn('Files', 'landlordBankName');
    await queryInterface.removeColumn('Files', 'landlordAccountNumber');
    await queryInterface.removeColumn('Files', 'landlordAccountName');
    await queryInterface.removeColumn('Files', 'landlordRoutingNumber');

    await queryInterface.addColumn('Files', 'landlordBankId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn('Files', 'tenantPaymentMethodId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Files', 'landlordBankId');
    await queryInterface.removeColumn('Files', 'tenantPaymentMethodId');

    await queryInterface.addColumn('Files', 'landlordCardholderName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordBillingAddress', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordCardNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordExpiryDate', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordCvv', {
      type: Sequelize.STRING(3),
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordBankName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordAccountNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordAccountName', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('Files', 'landlordRoutingNumber', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
