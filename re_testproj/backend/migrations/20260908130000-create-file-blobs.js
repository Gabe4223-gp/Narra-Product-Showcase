'use strict';

/**
 * Durable storage for generated and uploaded documents.
 *
 * Free-tier hosts give the app an ephemeral filesystem: anything written to
 * backend/lease_bills survives only until the next restart or deploy, so the
 * Files/Leases rows outlive the PDFs they point at and links 404. Postgres
 * persists, costs nothing extra, and needs no second service.
 *
 * bytea holds up to 1GB per value; invoices and lease PDFs are a few hundred
 * kilobytes at most.
 *
 * @type {import('sequelize-cli').Migration}
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('FileBlobs', {
      // The file name the rest of the app already uses as its identifier.
      key: {
        type: Sequelize.TEXT,
        primaryKey: true,
        allowNull: false,
      },
      contentType: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: 'application/octet-stream',
      },
      data: {
        type: Sequelize.BLOB, // bytea
        allowNull: false,
      },
      byteSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('FileBlobs');
  },
};
