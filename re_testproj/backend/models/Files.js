'use strict';
module.exports = (sequelize, DataTypes) => {
  const Files = sequelize.define('Files', {
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
    },
    landlordEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    landlordId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    deadline: {
      allowNull: true,
      type: DataTypes.DATE, 
    },
    proof: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordCardholderName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordBillingAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordCardNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordExpiryDate: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordCvv: {
      type: DataTypes.STRING(3),
      allowNull: true
    },
    landlordBankName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordAccountNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordAccountName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    landlordRoutingNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uploadedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    }
  }, {
    tableName: 'Files',
    freezeTableName: true,
    timestamps: true
  });

  Files.associate = function(models) {
    // Define associations if needed.
  };

  return Files;
};
