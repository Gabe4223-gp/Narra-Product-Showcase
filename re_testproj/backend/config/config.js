const path = require('path');

// Load backend/.env regardless of the process working directory. config.js is
// pulled in by models/index.js, which route files require at import time --
// often before any other dotenv call has run. Resolving from __dirname rather
// than cwd is what stops the environment from depending on require order.
// On a host like Render there is no .env file; dotenv no-ops and the real
// environment variables are used.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Every environment reads its connection string from DATABASE_URL, so no
// credentials live in this file. models/index.js already honours
// `use_env_variable` and will build Sequelize from that variable.
const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
};

const url = process.env.DATABASE_URL || '';

// Fail loudly and early. The route files at the top of Server.js pull in
// models/index.js, which constructs Sequelize long before Server.js can run
// its own DATABASE_URL check. Sequelize's error for a missing URL is an
// unrelated-looking "Cannot read properties of null (reading 'replace')"
// thrown from inside its constructor, which says nothing about the cause.
if (!/^postgres(ql)?:\/\//.test(url)) {
  console.error(
    [
      'DATABASE_URL is missing or malformed.',
      '  Expected a value starting with "postgresql://".',
      '  Received: ' + (url ? JSON.stringify(url.slice(0, 16) + '...') : '(not set)'),
      '  On a host such as Render, set it in the service environment variables.',
      '  Paste the bare URL only: no surrounding quotes, and not the',
      '  "psql \'...\'" snippet that some dashboards show.',
    ].join('\n')
  );
  process.exit(1);
}

// Managed Postgres (Neon, Supabase, Render) requires TLS. Detect it from the
// connection string host rather than NODE_ENV, so pointing any environment at
// a managed database just works and there is no extra variable to forget.
const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);

const managedSsl = isLocalDb
  ? {}
  : {
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    };

module.exports = {
  auth0: {
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
    audience: process.env.AUTH0_AUDIENCE,
  },
  development: { ...base, ...managedSsl },
  test: { ...base, ...managedSsl },
  production: { ...base, ...managedSsl },
};
