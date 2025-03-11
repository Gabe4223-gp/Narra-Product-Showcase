'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove 'teamsData'
    await queryInterface.removeColumn('Files', 'teamsData');
    
    // Remove 'tenantPaymentMethodId'
    await queryInterface.removeColumn('Files', 'tenantPaymentMethodId');
  },

  async down (queryInterface, Sequelize) {
    // If you need to revert these removals, add them back:
    
    await queryInterface.addColumn('Files', 'teamsData', {
      type: Sequelize.JSONB,
      allowNull: true
    });

    await queryInterface.addColumn('Files', 'tenantPaymentMethodId', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};