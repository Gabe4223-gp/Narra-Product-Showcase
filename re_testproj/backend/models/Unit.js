// models/Unit.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    unitNo: DataTypes.STRING,
    type: DataTypes.STRING,
    mode: DataTypes.STRING,
    sizeValue: DataTypes.INTEGER,
    sizeUnit: DataTypes.STRING,
    petsAllowed: DataTypes.BOOLEAN,
    tenants: DataTypes.ARRAY(DataTypes.STRING),
    // propertyId is now a UUID
    propertyId: DataTypes.UUID,
    waterLastReading: DataTypes.JSONB,
    waterCurrentReading: DataTypes.JSONB,
    electricityLastReading: DataTypes.JSONB,
    electricityCurrentReading: DataTypes.JSONB,
    issues: DataTypes.ARRAY(DataTypes.STRING),
    image: DataTypes.STRING,
    cost: DataTypes.DOUBLE,
    paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    leaseStarted: DataTypes.DATE,
    leaseExpiry: DataTypes.DATE,
  }, {});
  Unit.associate = function(models) {
    // e.g., Unit.belongsTo(models.Property, { foreignKey: 'propertyId' });
  };
  return Unit;
};
