require('dotenv').config();
const { auth } = require('express-oauth2-jwt-bearer');

const checkJwt = auth({
  issuerBaseURL: 'https://dev-dzsihvgdbhs65j6v.us.auth0.com/', // From .env
  audience: 'https://dev-dzsihvgdbhs65j6v.us.auth0.com/api/v2/',    
  jwksUri: 'https://dev-dzsihvgdbhs65j6v.us.auth0.com/.well-known/jwks.json',        // From .env
  tokenSigningAlg: 'RS256',                        // Must match Auth0 API
});

module.exports = checkJwt;
