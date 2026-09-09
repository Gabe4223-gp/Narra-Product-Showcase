/**
 * Deletes a user and every record that belongs to them.
 *
 * Shared by the "Delete Account" endpoint and scripts/purgeUser.js so both
 * behave identically.
 *
 * The schema links records three different ways -- foreign keys (mostly
 * ON DELETE SET NULL rather than CASCADE), array columns, and email strings --
 * so simply destroying the userProfile row leaves orphaned properties, units,
 * issues, bills and leases behind. Those are invisible to every dashboard,
 * which filters by user_id, but still occupy the database forever.
 *
 * Order matters. Issues in particular have no owner column at all: they are
 * reachable only through Units.issues[], so they must be collected before the
 * units are removed or they can never be found again.
 */

const { sequelize, UserProfile } = require('../models');

async function collectUserData(user) {
  const q = (sql, replacements) =>
    sequelize.query(sql, { replacements, logging: false }).then(([rows]) => rows);

  const properties = await q('SELECT id FROM "Properties" WHERE user_id = :id', { id: user.id });
  const propertyIds = properties.map((p) => p.id);

  const units = propertyIds.length
    ? await q('SELECT id, issues FROM "Units" WHERE "propertyId" IN (:propertyIds)', { propertyIds })
    : [];

  // Reachable only via Units.issues[] -- collect before deleting the units.
  const issueIds = [...new Set(units.flatMap((u) => u.issues || []).filter(Boolean))];

  const tenants = await q('SELECT id FROM "Tenants" WHERE user_id = :id', { id: user.id });
  const files = await q('SELECT "fileName" FROM "Files" WHERE "landlordId" = :id', { id: user.id });
  const leases = await q('SELECT "fileName" FROM "Leases" WHERE "landlordId" = :id', { id: user.id });
  const memberships = await q(
    'SELECT "teamId", "isOwner" FROM "TeamMembers" WHERE lower("memberEmail") = lower(:email)',
    { email: user.email }
  );

  // Only remove teams that would be left with nobody in them.
  const ownedTeamIds = memberships.filter((m) => m.isOwner).map((m) => m.teamId);
  const orphanTeams = ownedTeamIds.length
    ? await q(
        `SELECT t.id
           FROM "Teams" t
          WHERE t.id IN (:ownedTeamIds)
            AND NOT EXISTS (
              SELECT 1 FROM "TeamMembers" m
               WHERE m."teamId" = t.id AND lower(m."memberEmail") <> lower(:email))`,
        { ownedTeamIds, email: user.email }
      )
    : [];

  // Documents held in Postgres, when STORAGE_TYPE=postgres.
  const blobKeys = [...files, ...leases].map((r) => r.fileName).filter(Boolean);
  let blobKeysPresent = [];
  if (blobKeys.length) {
    const [exists] = await q(`SELECT to_regclass('public."FileBlobs"') IS NOT NULL AS present`);
    if (exists.present) {
      const rows = await q('SELECT "key" FROM "FileBlobs" WHERE "key" IN (:blobKeys)', { blobKeys });
      blobKeysPresent = rows.map((r) => r.key);
    }
  }

  return {
    propertyIds,
    unitCount: units.length,
    issueIds,
    tenantCount: tenants.length,
    fileCount: files.length,
    leaseCount: leases.length,
    membershipCount: memberships.length,
    orphanTeamIds: orphanTeams.map((t) => t.id),
    blobKeys: blobKeysPresent,
  };
}

/**
 * Look up a user by id or email and delete everything of theirs.
 * Runs in one transaction: any failure rolls the whole thing back.
 *
 * @returns {Promise<{user: object, summary: object}>}
 * @throws {Error} with .status 404 when no such user, 409 when ambiguous
 */
async function purgeUserData({ id, email }) {
  let user;

  if (id) {
    user = await UserProfile.findByPk(id);
  } else if (email) {
    const matches = await UserProfile.findAll({ where: sequelize.where(
      sequelize.fn('lower', sequelize.col('email')),
      String(email).toLowerCase()
    ) });
    if (matches.length > 1) {
      const err = new Error(`More than one profile uses ${email}; refusing to guess.`);
      err.status = 409;
      throw err;
    }
    user = matches[0];
  }

  if (!user) {
    const err = new Error('UserProfile not found.');
    err.status = 404;
    throw err;
  }

  const data = await collectUserData(user);
  const tx = await sequelize.transaction();
  const del = (sql, replacements) =>
    sequelize.query(sql, { replacements, transaction: tx, logging: false });

  try {
    if (data.blobKeys.length) {
      await del('DELETE FROM "FileBlobs" WHERE "key" IN (:blobKeys)', { blobKeys: data.blobKeys });
    }
    if (data.fileCount) await del('DELETE FROM "Files" WHERE "landlordId" = :id', { id: user.id });
    if (data.leaseCount) await del('DELETE FROM "Leases" WHERE "landlordId" = :id', { id: user.id });
    if (data.issueIds.length) {
      await del('DELETE FROM "Issues" WHERE id IN (:issueIds)', { issueIds: data.issueIds });
    }
    if (data.unitCount) {
      await del('DELETE FROM "Units" WHERE "propertyId" IN (:propertyIds)', { propertyIds: data.propertyIds });
    }
    if (data.tenantCount) await del('DELETE FROM "Tenants" WHERE user_id = :id', { id: user.id });
    if (data.propertyIds.length) {
      // Cascades WorkPortal via its foreign key.
      await del('DELETE FROM "Properties" WHERE user_id = :id', { id: user.id });
    }
    if (data.membershipCount) {
      await del('DELETE FROM "TeamMembers" WHERE lower("memberEmail") = lower(:email)', { email: user.email });
    }
    if (data.orphanTeamIds.length) {
      await del('DELETE FROM "Teams" WHERE id IN (:orphanTeamIds)', { orphanTeamIds: data.orphanTeamIds });
    }
    // Cascades Notifications via its foreign key.
    await del('DELETE FROM "userProfile" WHERE id = :id', { id: user.id });

    await tx.commit();
  } catch (err) {
    await tx.rollback();
    throw err;
  }

  return {
    user: { id: user.id, email: user.email, name: user.name },
    summary: {
      properties: data.propertyIds.length,
      units: data.unitCount,
      issues: data.issueIds.length,
      tenants: data.tenantCount,
      bills: data.fileCount,
      leases: data.leaseCount,
      teamMemberships: data.membershipCount,
      teamsRemoved: data.orphanTeamIds.length,
      documents: data.blobKeys.length,
    },
  };
}

module.exports = { purgeUserData, collectUserData };
