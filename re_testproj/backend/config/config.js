const path = require('path');

// Load backend/.env regardless of the process working directory. config.js is
// pulled in by models/index.js, which route files require at import time --
// often before any other dotenv call has run. Resolving from __dirname rather
// than cwd is what stops the environment from depending on require order.
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Every environment reads its connection string from DATABASE_URL, so no
// credentials live in this file. models/index.js already honours
// `use_env_variable` and will build Sequelize from that variable.
const base = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
};

// Managed Postgres (Neon, Supabase, Render) requires TLS, and presents certs
// that are not in Node's default trust store.
const managedSsl = {
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
  development: { ...base },
  test: { ...base },
  production: { ...base, ...managedSsl },
};
