require('dotenv').config();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

// Create the JWT validation middleware from the package
const checkJwt = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
  audience: process.env.AUTH0_AUDIENCE, // Must match your Auth0 API audience
  tokenSigningAlg: 'RS256',
});

// Create the permissions middleware
const checkPermissions = requiredScopes('read:payments');

// Combined middleware function
const authenticateToken = (req, res, next) => {
  console.log('JWT Middleware, Authorization Header:', req.headers.authorization); // Debug log
  checkJwt(req, res, (err) => {
    if (err) {
      console.error('JWT Error:', err.message);
      return res.status(401).json({ error: 'Unauthorized access' });
    }
    checkPermissions(req, res, (scopeErr) => {
      if (scopeErr) {
        console.error('Scope Error:', scopeErr.message);
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    });
  });
};

module.exports = authenticateToken;
