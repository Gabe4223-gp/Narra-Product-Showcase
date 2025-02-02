'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the 'Tenants' table
    await queryInterface.createTable('Tenants', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      unit_id: {
        type: Sequelize.STRING,
        onDelete: 'SET NULL', // Optional: Set unitId to null if the unit is deleted
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING, // Changed from INTEGER to STRING for phone numbers
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true, // Optional: Validates that the email is in a valid format
        },
      },
      leaseStarted: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      leaseExpiry: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      leaseDocs: {
        type: Sequelize.ARRAY(Sequelize.STRING), // Array of strings for document links
        allowNull: false,
        defaultValue: [],
      },
      moveinDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      moveoutDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      billingDeadline: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      occupation: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      image: {
        type: Sequelize.STRING, // Changed from URL to STRING
        allowNull: false,
        defaultValue: 'https://via.placeholder.com/150',
      },
      eWalletName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      eWalletReferenceNo: {
        type: Sequelize.STRING, // Changed from INTEGER to STRING
        allowNull: false,
      },
      bankName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      bankReferenceNo: {
        type: Sequelize.STRING, // Changed from INTEGER to STRING
        allowNull: false,
      },
      creditCardName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      creditCardNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      creditCardDate: {
        type: Sequelize.DATE, // Changed from INTEGER to DATE
        allowNull: true,
      },
      primaryPaymentMethod: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the 'Tenants' table
    await queryInterface.dropTable('Tenants');
  },
};
