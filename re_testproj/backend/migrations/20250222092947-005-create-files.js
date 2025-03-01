'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Files', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
        primaryKey: true
      },
      fileName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fileType: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pdf'
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      totalAmount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      propertyId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      tenantEmail: {
        // NEW: Store the tenant's email so that the endpoint can query correctly.
        type: Sequelize.STRING,
        allowNull: false,
      },
      landlordEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      landlordId: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      deadline: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      proof: {
        allowNull: true,
        type: Sequelize.TEXT,
      },
      landlordCardholderName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      landlordBillingAddress: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      landlordCardNumber: {
        type: Sequelize.STRING(19),
        allowNull: true,
      },
      landlordExpiryDate: {
        type: Sequelize.STRING(7),
        allowNull: true,
      },
      landlordCvv: {
        type: Sequelize.STRING(3),
        allowNull: true,
      },
      landlordBankName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      landlordAccountNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      landlordAccountName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      landlordRoutingNumber: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      uploadedAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      }
    }, {
      timestamps: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Files');
  }
};