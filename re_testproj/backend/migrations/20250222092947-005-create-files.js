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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Files');
  }
};