'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('userProfile', 'tenants', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []  // stores an array of emails
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('userProfile', 'tenants');
  }
};