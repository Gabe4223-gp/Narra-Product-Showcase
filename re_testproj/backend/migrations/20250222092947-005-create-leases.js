'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Leases', {
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
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
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
      signed: {
        type: Sequelize.BOOLEAN,
        allowedNull: true,
      },
      leaseStarted: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      leaseExpiry: {
        allowNull: true,
        type: Sequelize.DATE,
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
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Leases');
  }
};