// models/team.js
'use strict';
module.exports = (sequelize, DataTypes) => {
    const Team = sequelize.define('Team', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      applications: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tenants: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      units: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      issues: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      billings: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    }, {
      timestamps: true,
    });
  
    return Team;
  };
  