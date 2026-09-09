/**
 * Deletes the Auth0 login that goes with a deleted account.
 *
 * Removing the userProfile row is not enough on its own: the Auth0 identity
 * still exists, so the same person can sign in again and the app will simply
 * create a fresh profile for them. To a user who clicked "Delete Account",
 * that looks like the deletion silently failed.
 *
 * This needs a Machine-to-Machine application authorised for the Auth0
 * Management API with the delete:users and read:users scopes. If those
 * credentials are absent the function reports that it skipped, rather than
 * throwing -- the database purge is the part that must not fail, and an
 * unconfigured tenant should not block someone from deleting their data.
 */

const axios = require('axios');

const DOMAIN = process.env.AUTH0_DOMAIN;
const CLIENT_ID = process.env.AUTH0_MGMT_CLIENT_ID || process.env.AUTH0_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTH0_MGMT_CLIENT_SECRET || process.env.AUTH0_CLIENT_SECRET;

function isConfigured() {
  return Boolean(DOMAIN && CLIENT_ID && CLIENT_SECRET);
}

async function getManagementToken() {
  const { data } = await axios.post(
    `https://${DOMAIN}/oauth/token`,
    {
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      audience: `https://${DOMAIN}/api/v2/`,
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
  );
  return data.access_token;
}

/**
 * @returns {Promise<{status:'deleted'|'skipped'|'not_found'|'failed', detail?:string, count?:number}>}
 */
async function deleteAuth0UserByEmail(email) {
  if (!isConfigured()) {
    return { status: 'skipped', detail: 'Auth0 management credentials are not configured.' };
  }
  if (!email) {
    return { status: 'skipped', detail: 'No email on the profile to match against.' };
  }

  try {
    const token = await getManagementToken();
    const auth = { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 };

    const { data: users } = await axios.get(
      `https://${DOMAIN}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
      auth
    );

    if (!Array.isArray(users) || users.length === 0) {
      return { status: 'not_found', detail: `No Auth0 user with email ${email}.` };
    }

    // One email can map to several identities (database, Google, and so on).
    // Remove all of them, or the person can sign back in through another.
    for (const u of users) {
      await axios.delete(`https://${DOMAIN}/api/v2/users/${encodeURIComponent(u.user_id)}`, auth);
    }

    return { status: 'deleted', count: users.length };
  } catch (err) {
    const detail = err.response?.data?.message || err.message;
    console.error('Auth0 user deletion failed:', detail);
    return { status: 'failed', detail };
  }
}

module.exports = { deleteAuth0UserByEmail, isConfigured };
