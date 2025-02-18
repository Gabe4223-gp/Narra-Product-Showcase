module.exports = {
  auth0: {
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL, // Replace with your Auth0 domain
    audience: process.env.AUTH0_AUDIENCE, // Replace with your API audience
  },
  development: {
    "username": "postgres",
    "password": "Pleaseopenme123*",
    "database": "narra_database",
    "host": "127.0.0.1",
    "port": 5432,
    "dialect": "postgres"
  },
  test: {
    "username": "postgres",
    "password": "Pleaseopenme123*",
    "database": "narra_database",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  production: {
    "username": "postgres",
    "password": "Pleaseopenme123*",
    "database": "narra_database",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
};
console.log('Sequelize development config:', module.exports.development);
