'use strict';

module.exports = (sequelize, DataTypes) => {
  const Form = sequelize.define('Form', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Form 1', 'Complaint'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Form;
};
