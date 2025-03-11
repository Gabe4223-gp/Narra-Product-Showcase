'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('TeamMembers', 'userId', {
      type: Sequelize.UUID,
      allowNull: true // <--- Let it be null
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('TeamMembers', 'userId', {
      type: Sequelize.UUID,
      allowNull: false
    });
  }
};
