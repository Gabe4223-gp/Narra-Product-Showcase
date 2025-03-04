'use strict';

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4, // Auto-generate UUIDs
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'UserProfiles', // Ensure it matches your users table name
          key: 'id',
        },
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'Notifications', // Ensure consistency with the migration file
      timestamps: true, // Enables createdAt & updatedAt columns
      underscored: true, // Uses snake_case for DB column names
    }
  );

  Notification.associate = function (models) {
    Notification.belongsTo(models.UserProfile, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Notification;
};
