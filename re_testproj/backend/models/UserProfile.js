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
    storedPaymentMethods: { type: DataTypes.JSONB, allowNull: true },
    preferredPaymentMethod: { type: DataTypes.STRING, allowNull: true },
    landlordBankId: { type: DataTypes.STRING, allowNull: true },
    bankName: { type: DataTypes.STRING, allowNull: true },
    gcashMobileNumber: { type: DataTypes.STRING, allowNull: true },
    gcashTransactionId: { type: DataTypes.STRING, allowNull: true },
    gcashPaymentTime: { type: DataTypes.DATE, allowNull: true },

    // ★ Add the new JSONB field for landlord bank details:
    landlordBankDetails: {
      type: DataTypes.JSONB,
      allowNull: true
      // Example structure you might store here:
      // {
      //   bankName: "My Bank",
      //   accountNumber: "123456789",
      //   routingNumber: "987654321",
      //   swiftCode: "ABC123XYZ"
      // }
    }
  }, {
    tableName: 'userProfile',
    freezeTableName: true,
  });

  return UserProfile;
};
