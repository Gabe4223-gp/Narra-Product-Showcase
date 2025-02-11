'use strict';

module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define(
    'Property',
    {
      // `id` is automatically created by Sequelize by default (if no custom PK is defined).
      name: {
        type: DataTypes.STRING, // Or DataTypes.TEXT if names can be very long
        allowNull: false,
      },
    },
    {
      tableName: 'Properties', // optional, default table name is `Properties`
    }
  );

  // Define associations in an `associate` function
  Property.associate = (models) => {
    // One Property has many Units:
    Property.hasMany(models.Unit, {
      foreignKey: 'propertyId',   // the foreign key in the Units table
      as: 'units',                // optional "alias" for use in include/query
    });
  };

  return Property;
};
