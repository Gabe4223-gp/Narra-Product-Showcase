'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
      // By convention, you might call this table "TenantUnits"
      // But you can name it anything, e.g. "UnitsTenants" or "UnitTenantLinks"
      await queryInterface.createTable('TenantUnits', {
        // Option 1: No separate PK, just (tenantId, unitId) as composite PK
        // Option 2: If you prefer a standalone auto-increment PK, define one.
        tenantId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Tenants',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        unitId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'Units',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('NOW()')
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('NOW()')
        }
      });
  
      // (Optional) If you want (tenantId, unitId) to be a composite primary key:
      // await queryInterface.addConstraint('TenantUnits', {
      //   fields: ['tenantId', 'unitId'],
      //   type: 'primary key',
      //   name: 'PK_TenantUnits'
      // });
    },
  
    async down(queryInterface, Sequelize) {
      await queryInterface.dropTable('TenantUnits');
    }
  };