'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.addColumn('userProfile', 'personalAddressInfo', {
        type: Sequelize.JSONB,
        allowNull: true,
      }),
      queryInterface.addColumn('userProfile', 'businessAddressInfo', {
        type: Sequelize.JSONB,
        allowNull: true,
      }),
      queryInterface.addColumn('userProfile', 'businessDetails', {
        type: Sequelize.JSONB,
        allowNull: true,
      }),
      queryInterface.addColumn('userProfile', 'businessBankInfo', {
        type: Sequelize.JSONB,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await Promise.all([
      queryInterface.removeColumn('userProfile', 'personalAddressInfo'),
      queryInterface.removeColumn('userProfile', 'businessAddressInfo'),
      queryInterface.removeColumn('userProfile', 'businessDetails'),
      queryInterface.removeColumn('userProfile', 'businessBankInfo'),
    ]);
  }
};