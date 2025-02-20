'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    filename: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    fileType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    landlordemail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tenantemail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'Files',
    timestamps: false,
    freezeTableName: true,
  });
  return File;
};
