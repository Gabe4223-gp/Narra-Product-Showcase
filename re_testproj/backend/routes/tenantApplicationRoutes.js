const express = require('express');
const { TenantApplication } = require('../models'); // Import model
const { authenticateToken } = require('../middleware/authMiddleware'); // Import OAuth middleware
const router = express.Router();

// Middleware to protect routes
router.use(authenticateToken);

// Fetch tenant applications
router.get('/applications', async (req, res) => {
  try {
    const { date, page = 1, limit = 5 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows } = await TenantApplication.findAndCountAll({
      where: date ? { date: new Date(date) } : {},
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      order: [['date', 'ASC']],
    });

    res.status(200).json({ total: count, applications: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Accept application
router.post('/applications/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const application = await TenantApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = 'accepted';
    await application.save();

    res.status(200).json({ message: 'Application accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept application' });
  }
});

// Decline application
router.post('/applications/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;

    const application = await TenantApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    application.status = 'declined';
    await application.save();

    res.status(200).json({ message: 'Application declined' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline application' });
  }
});

module.exports = router;
