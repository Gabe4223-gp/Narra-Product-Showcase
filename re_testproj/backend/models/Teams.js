'use strict';
module.exports = (sequelize, DataTypes) => {
  const Teams = sequelize.define('Teams', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    teamName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true
    }
  }, {
    tableName: 'Teams',
    timestamps: true
  });

  Teams.associate = function(models) {
    // Teams can have many TeamMembers
    Teams.hasMany(models.TeamMembers, {
      foreignKey: 'teamId'
    });
  };

  return Teams;
};
