'use strict';

/**
 * POST /issues/resolution has always run
 *   UPDATE "Issues" SET resolution = :resolution
 * but no migration ever created that column, so the update failed and the
 * resolution text was never stored -- which is why resolved issues showed
 * no resolution message.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('Issues');
    if (!table.resolution) {
      await queryInterface.addColumn('Issues', 'resolution', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('Issues');
    if (table.resolution) {
      await queryInterface.removeColumn('Issues', 'resolution');
    }
  },
};
