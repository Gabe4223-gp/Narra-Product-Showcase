'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Units', 'billingDeadline', {
      type: Sequelize.DATE,  // Date type for deadline
      allowNull: true,
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Units', 'billingDeadline');
  }
};
