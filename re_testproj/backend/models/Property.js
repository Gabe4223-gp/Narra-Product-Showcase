'use strict';
module.exports = (sequelize, DataTypes) => {
  const Property = sequelize.define('Property', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: DataTypes.UUID,
    companyName: DataTypes.STRING,
    propertyName: DataTypes.STRING,
    address: DataTypes.STRING,
    image: DataTypes.STRING,
    owner: DataTypes.STRING,
    tenants: DataTypes.ARRAY(DataTypes.STRING),
    units: DataTypes.ARRAY(DataTypes.STRING),
  }, {});
  Property.associate = function(models) {
    // associations can be defined here
  };
  return Property;
};
