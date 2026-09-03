const express = require('express');
const { EmailMessage } = require('../models'); // Import model
const nodemailer = require('nodemailer'); // For sending emails
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

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
router.post('/:id/accept', requireAuth, async (req, res) => {
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
    if (process.env.EMAIL_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email disabled or SMTP credentials missing; not sending.');
      return res.json({ message: 'Saved. Email notification is disabled on this deployment.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Landlord" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
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
router.post('/:id/decline', requireAuth, async (req, res) => {
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
    if (process.env.EMAIL_ENABLED !== 'true' || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('Email disabled or SMTP credentials missing; not sending.');
      return res.json({ message: 'Saved. Email notification is disabled on this deployment.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Landlord" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
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
