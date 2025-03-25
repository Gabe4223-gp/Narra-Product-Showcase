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
    "password": "***REMOVED***",  // RDS password for production
    "database": "narradatabase",  // The name of your production database in RDS
    "host": "narra-database.cvqogko42aeu.us-east-2.rds.amazonaws.com", // RDS endpoint
    "dialect": "postgres"
  }
};
console.log('Sequelize production config:', module.exports.production);
