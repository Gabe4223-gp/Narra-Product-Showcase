'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('userProfiles', 'units', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),  // Array of unit IDs
      allowNull: true,
      defaultValue: [],
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('userProfiles', 'units');
  }
};