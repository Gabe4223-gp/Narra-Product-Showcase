#!/usr/bin/env node
/**
 * Remove a user and everything belonging to them, from the command line.
 *
 * Shares services/purgeUserData.js with the Delete Account endpoint, so the
 * two cannot drift apart. This script covers database records only; it does
 * not touch the Auth0 login (the Settings button does both).
 *
 * Usage, from backend/:
 *   node scripts/purgeUser.js <email>              # dry run, changes nothing
 *   node scripts/purgeUser.js <email> --confirm    # actually delete
 *
 * Acts on whatever DATABASE_URL points at. To target the deployed database:
 *   DATABASE_URL="<neon url>" node scripts/purgeUser.js <email>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sequelize, UserProfile } = require('../models');
const { purgeUserData, collectUserData } = require('../services/purgeUserData');

const email = process.argv[2];
const confirmed = process.argv.includes('--confirm');

if (!email || email.startsWith('--')) {
  console.error('Usage: node scripts/purgeUser.js <email> [--confirm]');
  process.exit(1);
}

(async () => {
  const target = (process.env.DATABASE_URL || '').replace(/\/\/[^@]*@/, '//***@');
  console.log(`\nDatabase : ${target}`);
  console.log(`User     : ${email}`);
  console.log(`Mode     : ${confirmed ? 'DELETE' : 'dry run (no changes)'}\n`);

  const matches = await UserProfile.findAll({
    where: sequelize.where(sequelize.fn('lower', sequelize.col('email')), String(email).toLowerCase()),
  });

  if (matches.length === 0) {
    console.error(`No userProfile found for ${email}. Nothing to do.`);
    await sequelize.close();
    process.exit(1);
  }
  if (matches.length > 1) {
    console.error(`Found ${matches.length} profiles with that email. Refusing to guess.`);
    matches.forEach((u) => console.error(`  ${u.id}  ${u.name}`));
    await sequelize.close();
    process.exit(1);
  }

  const user = matches[0];
  console.log(`Matched  : ${user.name || '(no name)'}  ${user.id}\n`);

  const data = await collectUserData(user);

  console.log('Will remove:');
  console.log(`  Properties       ${data.propertyIds.length}`);
  console.log(`  Units            ${data.unitCount}`);
  console.log(`  Issues           ${data.issueIds.length}`);
  console.log(`  Tenants          ${data.tenantCount}`);
  console.log(`  Bills (Files)    ${data.fileCount}`);
  console.log(`  Leases           ${data.leaseCount}`);
  console.log(`  Team memberships ${data.membershipCount}`);
  console.log(`  Teams emptied    ${data.orphanTeamIds.length}`);
  console.log(`  Stored documents ${data.blobKeys.length}`);
  console.log(`  userProfile      1`);
  console.log('  Work portals and notifications cascade with the above.\n');

  if (!confirmed) {
    console.log('Dry run only. Re-run with --confirm to delete.\n');
    await sequelize.close();
    return;
  }

  const { summary } = await purgeUserData({ id: user.id });
  console.log('Done, in a single transaction:', summary);
  console.log('\nNote: database records only. The Auth0 login is untouched;');
  console.log('the Delete Account button in Settings removes that as well.\n');

  await sequelize.close();
})().catch(async (err) => {
  console.error('\nFailed:', err.message);
  try { await sequelize.close(); } catch (_) { /* already closed */ }
  process.exit(1);
});
