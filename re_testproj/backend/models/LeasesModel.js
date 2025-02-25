'use strict';
module.exports = (sequelize, DataTypes) => {
  const Leases = sequelize.define('Leases', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    tenantEmail: {
      type: DataTypes.STRING,
      allowNull: false
    },
    landlordEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    signed: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    leaseStarted: {
      type: DataTypes.DATE,
      allowNull: true
    },
    leaseExpiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'Leases',
    freezeTableName: true
  });

  Leases.associate = function(models) {
    // Define associations here if needed in the future
  };

  return Leases;
};
