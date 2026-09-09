'use strict';

/**
 * Per-team permissions for the accounting suite.
 *
 * TeamMembers already gates applications, tenants, units, issues and billings.
 * The four accounting pages were ungated, so they showed for everyone -- even
 * with no active team, where the rest of the sidebar correctly collapses to
 * Dashboard and Settings. These columns bring them under the same control.
 *
 * Defaults to false: a new member sees nothing until it is granted, which
 * matches how the existing permissions behave.
 *
 * @type {import('sequelize-cli').Migration}
 */
const COLUMNS = ['accounting', 'profitLoss', 'taxFiling', 'generalLedger'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('TeamMembers');
    for (const name of COLUMNS) {
      if (!table[name]) {
        await queryInterface.addColumn('TeamMembers', name, {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        });
      }
    }

    // Owners and admins already have every other permission, so grant these
    // too rather than locking existing users out of pages they could see.
    await queryInterface.sequelize.query(
      `UPDATE "TeamMembers"
          SET "accounting" = true,
              "profitLoss" = true,
              "taxFiling" = true,
              "generalLedger" = true
        WHERE "isOwner" = true OR "isAdmin" = true`
    );
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('TeamMembers');
    for (const name of COLUMNS) {
      if (table[name]) {
        await queryInterface.removeColumn('TeamMembers', name);
      }
    }
  },
};
