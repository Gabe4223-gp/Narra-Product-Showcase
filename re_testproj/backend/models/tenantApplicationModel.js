'use strict';

module.exports = (sequelize, DataTypes) => {
  const TenantApplication = sequelize.define('TenantApplication', {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    form: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      defaultValue: 'pending',
    },
  });

  return TenantApplication;
};
