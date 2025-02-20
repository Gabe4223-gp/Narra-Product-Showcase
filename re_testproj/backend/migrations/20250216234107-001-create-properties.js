'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Properties', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('uuid_generate_v4()'),
      },
      user_id: {
        type: Sequelize.UUID,
        references: {
          model: "userProfile", // Make sure this table exists
          key: "id",
        },
        onDelete: 'SET NULL',  // or 'CASCADE' or 'RESTRICT' based on your use case
        allowNull: true,  // or false if you want to enforce every tenant to have a user_id
      },
      companyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      propertyName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      owner: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      tenants: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      units: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Properties');
  }
};
