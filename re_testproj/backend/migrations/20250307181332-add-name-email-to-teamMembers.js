'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('TeamMembers', 'memberName', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('TeamMembers', 'memberEmail', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('TeamMembers', 'memberName');
    await queryInterface.removeColumn('TeamMembers', 'memberEmail');
  }
};