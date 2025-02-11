const express = require('express');
const router = express.Router();

// Example protected route
router.get('/protected', (req, res) => {
  console.log('Decoded JWT payload:', req.auth);
  res.json({
    message: 'You have accessed a protected route!',
    user: req.auth, // Decoded JWT payload will be available here
  });
});

module.exports = router;
