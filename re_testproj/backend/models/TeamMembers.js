'use strict';
module.exports = (sequelize, DataTypes) => {
  const TeamMembers = sequelize.define('TeamMembers', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    teamId: DataTypes.UUID,
    userId: {
      type: DataTypes.UUID,
      allowNull: true  // match the new migration
    },    

    // New columns for storing name/email in the pivot
    memberName: DataTypes.STRING,
    memberEmail: DataTypes.STRING,

    isOwner: DataTypes.BOOLEAN,
    isAdmin: DataTypes.BOOLEAN,
    applications: DataTypes.BOOLEAN,
    tenants: DataTypes.BOOLEAN,
    units: DataTypes.BOOLEAN,
    issues: DataTypes.BOOLEAN,
    billings: DataTypes.BOOLEAN
  }, {
    tableName: 'TeamMembers',
    timestamps: true
  });

  TeamMembers.associate = function(models) {
    TeamMembers.belongsTo(models.Teams, { foreignKey: 'teamId' });
    // If you'd like, you can also link to UserProfile by userId
    // TeamMembers.belongsTo(models.UserProfile, { foreignKey: 'userId' });
  };

  return TeamMembers;
};
