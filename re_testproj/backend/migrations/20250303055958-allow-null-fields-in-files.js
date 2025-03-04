'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Files', 'url', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Files', 'totalAmount', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.changeColumn('Files', 'paid', {
      type: Sequelize.BOOLEAN,
      allowNull: true
    });

    await queryInterface.changeColumn('Files', 'tenantEmail', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.changeColumn('Files', 'teamsData', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('Files', 'url', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Files', 'totalAmount', {
      type: Sequelize.FLOAT,
      allowNull: false
    });

    await queryInterface.changeColumn('Files', 'paid', {
      type: Sequelize.BOOLEAN,
      allowNull: false
    });

    await queryInterface.changeColumn('Files', 'tenantEmail', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.changeColumn('Files', 'teamsData', {
      type: Sequelize.JSONB,
      allowNull: false
    });
  }
};