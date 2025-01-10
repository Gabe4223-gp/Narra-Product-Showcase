module.exports = {
  auth0: {
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL, // Replace with your Auth0 domain
    audience: process.env.AUTH0_AUDIENCE, // Replace with your API audience
  },
  development: {
    "username": "postgres",
    "password": "***REMOVED***",
    "database": "narra_payment_history",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres"
  },
  test: {
    "username": "postgres",
    "password": "***REMOVED***",
    "database": "narra_payment_history",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  production: {
    "username": "postgres",
    "password": "***REMOVED***",
    "database": "narra_payment_history",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
};
