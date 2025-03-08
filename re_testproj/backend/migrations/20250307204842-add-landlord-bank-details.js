'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the landlordBankDetails column to userProfile table
    await queryInterface.addColumn('Files', 'landlordBankDetails', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    // Reverse the addition of landlordBankDetails column
    await queryInterface.removeColumn('Files', 'landlordBankDetails');
  }
};