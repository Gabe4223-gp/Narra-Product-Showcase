'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Units', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      unitNo: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sizeValue: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      sizeUnit: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      petsAllowed: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      tenants: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      propertyId: {
        // old: type: Sequelize.STRING,
        type: Sequelize.UUID,
        allowNull: true,
      },      
      waterLastReading: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      waterCurrentReading: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      electricityLastReading: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      electricityCurrentReading: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      issues: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      // New fields:
      cost: {
        type: Sequelize.DOUBLE,  // double precision
        allowNull: true,
      },
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      leaseStarted: {
        type: Sequelize.DATE,  // timestamp with time zone
        allowNull: true,
      },
      leaseExpiry: {
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
    await queryInterface.dropTable('Units');
  }
};
