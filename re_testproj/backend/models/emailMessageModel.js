'use strict';

module.exports = (sequelize, DataTypes) => {
  const EmailMessage = sequelize.define('EmailMessage', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      defaultValue: 'pending',
    },
  });

  return EmailMessage;
};
