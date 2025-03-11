'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) Create Teams table
    await queryInterface.createTable('Teams', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      teamName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdBy: {
        type: Sequelize.UUID,  // references userProfile.id if desired
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // 2) Create TeamMembers pivot table
    await queryInterface.createTable('TeamMembers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      teamId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Teams',
          key: 'id'
        },
        onDelete: 'CASCADE'  // If a team is deleted, remove memberships
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false
        // references: { model: 'UserProfile', key: 'id' },
        // onDelete: 'CASCADE' – up to your logic
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isOwner: {
        type: Sequelize.BOOLEAN,
        defaultValue: false  // If we want to differentiate from admin
      },
      applications: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      tenants: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      units: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      issues: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      billings: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Reverse in correct order
    await queryInterface.dropTable('TeamMembers');
    await queryInterface.dropTable('Teams');
  }
};