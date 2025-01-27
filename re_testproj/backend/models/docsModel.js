'use strict';

module.exports = (sequelize, DataTypes) => {
  const Doc = sequelize.define('Doc', {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('Lease Contract'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  });

  return Doc;
};
