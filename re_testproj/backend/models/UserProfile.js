// models/userProfile.js
'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserProfile = sequelize.define('UserProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    dateofBirth: DataTypes.DATE,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    // CHANGED TO ARRAY OF UUID
    units: DataTypes.ARRAY(DataTypes.UUID),

    cardholderName: DataTypes.STRING,
    billingAddress: DataTypes.STRING,
    cardNumber: { 
      type: DataTypes.STRING(19),
      allowNull: true,
    },
    expiryDate: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    cvv: DataTypes.INTEGER,
    billingZipCode: DataTypes.STRING,
    bank: DataTypes.STRING,
    accountNumber: DataTypes.STRING,
    accountName: DataTypes.STRING,
    gcashMobileNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gcashTransactionId: DataTypes.STRING,
    gcashPaymentTime: DataTypes.DATE,
  }, {
    tableName: 'userProfile',
    freezeTableName: true,
  });
  UserProfile.associate = function(models) {
    // associations if needed
  };
  return UserProfile;
};
