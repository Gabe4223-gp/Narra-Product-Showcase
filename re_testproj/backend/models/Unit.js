'use strict';

module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define(
    'Unit',
    {
      // `id` is automatically created unless otherwise specified
      unitNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'Units',
    }
  );

  Unit.associate = (models) => {
    // Many Units belong to One Property:
    Unit.belongsTo(models.Property, {
      foreignKey: 'propertyId',
      as: 'property',
    });

    // Many-to-Many relationship with Tenants:
    // - This will create (or use) a join table named `TenantUnits` by default.
    //   If you want a custom table name, specify `through: 'SomeCustomName'`.
    Unit.belongsToMany(models.Tenant, {
      through: 'TenantUnits',  // name of the join table
      foreignKey: 'unitId',    // column in join table for this model
      otherKey: 'tenantId',    // column in join table for the other model
      as: 'tenants',           // alias when eager-loading
    });
  };

  return Unit;
};
