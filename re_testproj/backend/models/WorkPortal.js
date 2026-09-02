'use strict'
module.exports = (sequelize, DataTypes) => {
  const WorkPortal = sequelize.define('WorkPortal', {
    propertyId: DataTypes.UUID,
    latitude: DataTypes.FLOAT,
    longitude: DataTypes.FLOAT,
    fallbackAddress: DataTypes.STRING,
    contractors: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    ratings: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },    
  }, {
    tableName: 'WorkPortal' // Tells Sequelize not to pluralize
  })
  WorkPortal.associate = function(models) {
    WorkPortal.belongsTo(models.Property, { foreignKey: 'propertyId' })
  }
  return WorkPortal
}
