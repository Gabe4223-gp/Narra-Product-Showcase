'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tenants', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: "userProfile", // Make sure this table exists
          key: "id",
        },
        onDelete: 'SET NULL',  // or 'CASCADE' or 'RESTRICT' based on your use case
        allowNull: true,  // or false if you want to enforce every tenant to have a user_id
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      leaseStarted: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      leaseExpiry: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      leaseDocs: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      moveinDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      moveoutDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      billingDeadline: {   // New column for tenants
        type: Sequelize.DATE,
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      occupation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eWalletName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eWalletReferenceNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bankName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      bankReferenceNo: {
        type: Sequelize.STRING,
        allowNull: true,
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
        type: Sequelize.DATE,
        allowNull: true,
      },
      primaryPaymentMethod: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      govid: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      propertyId: {
        type: Sequelize.UUID,
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
    await queryInterface.dropTable('Tenants');
  }
};
