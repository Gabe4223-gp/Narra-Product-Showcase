'use strict';

module.exports = (sequelize, DataTypes) => {
    const UserProfile = sequelize.define('UserProfile', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phoneNumber: DataTypes.BIGINT, // changed to BIGINT
      dateOfBirth: DataTypes.DATEONLY,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      units: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: true,
        defaultValue: [],
      },
      // Debit/Credit Card Payment Information
      cardholderName: DataTypes.STRING,
      billingAddress: DataTypes.STRING,
      cardNumber: DataTypes.BIGINT, // changed to BIGINT
      expiryDate: DataTypes.DATE, // changed to DATE
      cvv: DataTypes.INTEGER, // changed to INTEGER
      billingZipCode: DataTypes.STRING,
      // Bank Transfer Payment Information
      bank: DataTypes.STRING,
      accountNumber: DataTypes.INTEGER, // changed to INTEGER
      accountName: DataTypes.STRING,
      // GCash Payment Information
      gcashMobileNumber: DataTypes.BIGINT, // changed to BIGINT
      gcashTransactionId: DataTypes.STRING,
      gcashPaymentStatus: DataTypes.BOOLEAN, // changed to BOOLEAN
      gcashPaymentTime: DataTypes.DATE,
    }, {});
  
    UserProfile.associate = (models) => {
      // One UserProfile has many Units:
    };
  
    return UserProfile;
};