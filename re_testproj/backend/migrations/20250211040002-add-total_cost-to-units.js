'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Units', 'total_cost', {
      type: Sequelize.FLOAT, // FLOAT is a common choice for cost/price values.
      allowNull: true,
      defaultValue: 0, // You can set a default value if needed.
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Units', 'total_cost');
  }
};