'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define('UserProfile', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    dateofBirth: DataTypes.DATE,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    units: DataTypes.ARRAY(DataTypes.UUID),
    storedPaymentMethods: { type: DataTypes.JSONB, allowNull: true }, // Stores multiple PaymentMethod IDs
    preferredPaymentMethod: { type: DataTypes.STRING, allowNull: true }, // Tenant's preferred PaymentMethod ID
    landlordBankId: { type: DataTypes.STRING, allowNull: true }, // Landlord's securely stored Bank ID
    bankName: { type: DataTypes.STRING, allowNull: true }, // Stores the selected bank name
    gcashMobileNumber: { type: DataTypes.STRING, allowNull: true },
    gcashTransactionId: { type: DataTypes.STRING, allowNull: true },
    gcashPaymentTime: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'userProfile',
    freezeTableName: true,
  });

  return UserProfile;
};
