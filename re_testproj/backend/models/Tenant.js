'use strict';
module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    unit: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    leaseStarted: DataTypes.DATE,
    leaseExpiry: DataTypes.DATE,
    leaseDocs: DataTypes.ARRAY(DataTypes.STRING),
    moveinDate: DataTypes.DATE,
    moveoutDate: DataTypes.DATE,
    billingDeadline: DataTypes.DATE,
    nationality: DataTypes.STRING,
    occupation: DataTypes.STRING,
    image: DataTypes.STRING,
    eWalletName: DataTypes.STRING,
    eWalletReferenceNo: DataTypes.STRING,
    bankName: DataTypes.STRING,
    bankReferenceNo: DataTypes.STRING,
    creditCardName: DataTypes.STRING,
    creditCardNo: DataTypes.STRING,
    creditCardDate: DataTypes.DATE,
    primaryPaymentMethod: DataTypes.STRING,
    govid: DataTypes.ARRAY(DataTypes.STRING),
  }, {});
  Tenant.associate = function(models) {
    // associations if needed
  };
  return Tenant;
};
