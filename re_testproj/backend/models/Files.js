'use strict';
module.exports = (sequelize, DataTypes) => {
  const Files = sequelize.define('Files', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING,
      defaultValue: 'pdf',
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
    totalAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      allowNull: false
    },
    paid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    propertyId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    tenantEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'tenantemail'  // maps JS attribute tenantEmail to DB column tenantemail
    },
    landlordId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    signed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Files',
    freezeTableName: true
  });

  Files.associate = function(models) {
    // Define associations if needed.
  };

  return Files;
};
