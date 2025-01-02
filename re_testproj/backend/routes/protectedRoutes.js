const express = require('express');
const checkJwt = require('../middleware/authMiddleware');

const router = express.Router();

// Example protected route
router.get('/protected', checkJwt, (req, res) => {
  res.json({
    message: 'You have accessed a protected route!',
    user: req.auth, // Decoded JWT payload will be available here
  });
});

module.exports = router;
