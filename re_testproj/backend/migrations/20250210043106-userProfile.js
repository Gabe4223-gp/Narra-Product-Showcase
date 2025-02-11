'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('userProfiles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // Personal Information
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      phoneNumber: {
        type: Sequelize.BIGINT, // changed to BIGINT for phone numbers
        allowNull: true,
      },
      dateOfBirth: {
        type: Sequelize.DATEONLY,
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
      // Debit/Credit Card Payment Information
      cardholderName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billingAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cardNumber: {
        type: Sequelize.BIGINT, // changed to BIGINT for card numbers
        allowNull: true,
      },
      expiryDate: {
        type: Sequelize.DATE, // changed to DATE
        allowNull: true,
      },
      cvv: {
        type: Sequelize.INTEGER, // changed to INTEGER
        allowNull: true,
      },
      billingZipCode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // Bank Transfer Payment Information
      bank: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      accountNumber: {
        type: Sequelize.INTEGER, // changed to INTEGER
        allowNull: true,
      },
      accountName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // GCash Payment Information
      gcashMobileNumber: {
        type: Sequelize.BIGINT, // changed to BIGINT
        allowNull: true,
      },
      gcashTransactionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gcashPaymentStatus: {
        type: Sequelize.BOOLEAN, // changed to BOOLEAN
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
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('userProfiles');
  },
};

