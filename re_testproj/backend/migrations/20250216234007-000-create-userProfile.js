'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('userProfile', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dateofBirth: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      units: {
        // Now an array of UUIDs
        type: Sequelize.ARRAY(Sequelize.UUID),
        allowNull: true,
        defaultValue: [],
      },
      
      cardholderName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billingAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cardNumber: {
        type: Sequelize.STRING(19),
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.STRING(7),
        allowNull: true,
      },
      cvv: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      billingZipCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bank: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      routingNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gcashMobileNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gcashTransactionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gcashPaymentTime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('userProfile');
  }
};

