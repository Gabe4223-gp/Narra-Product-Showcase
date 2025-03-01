'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Teams', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      applications: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      tenants: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      units: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      issues: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      billings: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Teams');
  },
};