require('dotenv').config();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

// Validates the Auth0 access token: RS256 signature (fetched from the
// tenant's JWKS endpoint), issuer, audience and expiry.
//
// AUTH0_AUDIENCE must be the *API Identifier* registered in Auth0
// (Applications -> APIs), and must match REACT_APP_AUTH0_AUDIENCE in the
// frontend .env exactly. It does not have to be a resolvable URL, but a
// mismatch means every token is rejected.
const checkJwt = auth({
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || `https://${process.env.AUTH0_DOMAIN}/`,
  audience: process.env.AUTH0_AUDIENCE,
  tokenSigningAlg: 'RS256',
});

// Require a valid token. Use on anything that sends mail, deletes in bulk,
// or moves money.
//
// Deliberately does NOT require a scope. The previous version demanded
// 'read:payments', which 403s unless that permission is defined on the API
// in Auth0 *and* granted to the caller -- a silent lockout that is hard to
// diagnose. Use requireScope() below where you genuinely need one.
const requireAuth = (req, res, next) => {
  if (!process.env.AUTH0_AUDIENCE) {
    console.error('AUTH0_AUDIENCE is not set; refusing to serve a protected route.');
    return res.status(500).json({ error: 'Server auth is misconfigured.' });
  }

  checkJwt(req, res, (err) => {
    if (err) {
      console.error('JWT rejected:', err.message);
      return res.status(401).json({ error: 'Sign in to perform this action.' });
    }
    next();
  });
};

// Opt-in scope check, for when the Auth0 API actually defines permissions.
const requireScope = (...scopes) => {
  const check = requiredScopes(scopes);
  return (req, res, next) => {
    check(req, res, (err) => {
      if (err) {
        console.error('Scope rejected:', err.message);
        return res.status(403).json({ error: 'Your account lacks permission for this action.' });
      }
      next();
    });
  };
};

module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireScope = requireScope;
