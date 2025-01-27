const express = require('express');
const { EmailMessage } = require('../models'); // Import model
const { authenticateToken } = require('../middleware/authMiddleware'); // OAuth middleware
const nodemailer = require('nodemailer'); // For sending emails
const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Fetch email messages with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await EmailMessage.findAndCountAll({
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ total: count, emails: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch email messages' });
  }
});

// Accept an email and send a reply
router.post('/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;

    const emailMessage = await EmailMessage.findByPk(id);
    if (!emailMessage) {
      return res.status(404).json({ error: 'Email message not found' });
    }

    // Update status to accepted
    emailMessage.status = 'accepted';
    await emailMessage.save();

    // Send an email back to the sender
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-email-password', // Replace with your password or app password
      },
    });

    await transporter.sendMail({
      from: '"Landlord" <your-email@gmail.com>',
      to: emailMessage.email,
      subject: 'Landlord has accepted your Email! You are now connected.',
      text: `Dear tenant, your email has been accepted. Let's get connected!`,
    });

    res.status(200).json({ message: 'Email accepted and reply sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to accept and send email' });
  }
});

// Decline an email and send an automated message
router.post('/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;

    const emailMessage = await EmailMessage.findByPk(id);
    if (!emailMessage) {
      return res.status(404).json({ error: 'Email message not found' });
    }

    // Update status to declined
    emailMessage.status = 'declined';
    await emailMessage.save();

    // Send a decline email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-email-password', // Replace with your password or app password
      },
    });

    await transporter.sendMail({
      from: '"Landlord" <your-email@gmail.com>',
      to: emailMessage.email,
      subject: 'Narra: Your message has been declined.',
      text: 'Sorry, the landlord did not accept your email.',
    });

    res.status(200).json({ message: 'Email declined and notification sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to decline and send email' });
  }
});

module.exports = router;
