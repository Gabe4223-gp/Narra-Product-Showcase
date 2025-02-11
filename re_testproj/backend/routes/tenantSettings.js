// routes/tenant.js
const express = require('express');
const router = express.Router();
const { Tenant } = require('../models'); // Adjust path as needed

// Update tenant settings (excluding password update)
router.put('/settings', async (req, res) => {
  // Assume req.body contains: id, name, phone, dob, email
  const { id, name, phone, dob, email } = req.body;
  
  try {
    // Find tenant by primary key (id)
    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Update tenant fields
    tenant.name = name;
    tenant.phone = phone;
    tenant.dob = dob;
    tenant.email = email;
    await tenant.save();

    res.json({ message: 'Tenant settings updated successfully', tenant });
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    res.status(500).json({ error: 'Server error updating tenant settings' });
  }
});

// Separate endpoint for changing password (if needed)
router.put('/change-password', async (req, res) => {
  // Assume req.body contains: id, newPassword
  const { id, newPassword } = req.body;
  
  try {
    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Example: tenant.setPassword(newPassword) if you have a method for hashing, etc.
    tenant.password = newPassword; // In real usage, hash the password!
    await tenant.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error updating password' });
  }
});

module.exports = router;
