'use strict';

/*@type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the 'Tenants' table
    await queryInterface.createTable('Issues', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      companyName: {
        type: Sequelize.STRING,
        defaultValue: 'NA',
      },
      propertyName: {
        type: Sequelize.STRING,
        defaultValue: 'NA',
      },
      propertyAddress: {
        type: Sequelize.STRING,
        defaultValue: 'NA',
      },
      image: {
        type: Sequelize.STRING,
        defaultValue: 'https://via.placeholder.com/150',
      },
      owner: {
        type: Sequelize.STRING,
        defaultValue: 'NA',
      },
      tenants: {
        type: Sequelize.JSONB, // For PostgreSQL, use JSONB
        defaultValue: [],
      },
      units: {
        type: Sequelize.JSONB, // For PostgreSQL, use JSONB
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop the 'Tenants' table
    await queryInterface.dropTable('Issues');
  },
};
