'use strict';
module.exports = (sequelize, DataTypes) => {
  const Files = sequelize.define('Files', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    fileName: DataTypes.STRING,
    fileType: { type: DataTypes.STRING, defaultValue: 'pdf' },
    url: DataTypes.STRING,
    subject: DataTypes.STRING,
    totalAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
    paid: { type: DataTypes.BOOLEAN, defaultValue: false },
    propertyId: DataTypes.UUID,
    tenantEmail: DataTypes.STRING,
    landlordEmail: DataTypes.STRING,
    landlordId: DataTypes.UUID,
    deadline: DataTypes.DATE,
    proof: DataTypes.STRING,
    landlordBankId: { type: DataTypes.STRING, allowNull: true }, // Securely stored Bank ID
    tenantPaymentMethodId: { type: DataTypes.STRING, allowNull: true }, // Securely stored Payment Method ID
    teamsData: DataTypes.JSONB,
    uploadedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    tableName: 'Files',
    freezeTableName: true,
    timestamps: true
  });

  return Files;
};
