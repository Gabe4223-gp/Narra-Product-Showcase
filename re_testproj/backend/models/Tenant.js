'use strict';

module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      // `id` is created by default
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'Tenants',
    }
  );

  Tenant.associate = (models) => {
    // Many-to-Many relationship with Units:
    Tenant.belongsToMany(models.Unit, {
      through: 'TenantUnits',  // same join table name
      foreignKey: 'tenantId',
      otherKey: 'unitId',
      as: 'units',             // alias
    });
  };

  return Tenant;
};
