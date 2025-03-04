// routes/userProfileRoutes.js
const express = require('express');
const router = express.Router();
const { sequelize, UserProfile, Team } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios'); // For Wise API calls
require('dotenv').config();

const WISE_API_URL = process.env.WISE_API_URL; // Wise API base URL
const WISE_API_KEY = process.env.WISE_API_KEY; // API Key for authentication

// GET endpoint to retrieve payment method details for editing
router.get('/payment-methods', async (req, res) => {
  try {
    const { userProfileId } = req.query;

    if (!userProfileId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const userProfile = await UserProfile.findByPk(userProfileId);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // Fetch stored payment methods (Bank & Card)
    const bankCardInfo = userProfile.storedPaymentMethods ? {
      type: "Bank & Card",
      nameOnAccount: userProfile.storedPaymentMethods.nameOnAccount || "",
      accountNumber: userProfile.storedPaymentMethods.accountNumber || "",
      routingNumber: userProfile.storedPaymentMethods.routingNumber || "",
      cardholderName: userProfile.storedPaymentMethods.cardholderName || "",
      billingAddress: userProfile.storedPaymentMethods.billingAddress || "",
      billingZipCode: userProfile.storedPaymentMethods.billingZipCode || "",
      bankName: userProfile.bankName || "",
    } : null;

    // Fetch GCash information separately
    const gcashInfo = userProfile.gcashMobileNumber ? {
      type: "GCash",
      gcashMobileNumber: userProfile.gcashMobileNumber,
    } : null;

    const paymentMethods = [];
    if (bankCardInfo) paymentMethods.push(bankCardInfo);
    if (gcashInfo) paymentMethods.push(gcashInfo);

    return res.json({ paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT endpoint to update payment method data with raw queries only for Tenants
// PUT: Store Bank & Card information inside storedPaymentMethods
router.put('/payment-method', async (req, res) => {
  try {
    const { userProfileId, paymentType, data } = req.body;

    if (!userProfileId || !paymentType || !data) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const userProfile = await UserProfile.findByPk(userProfileId);
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    if (paymentType === "Bank & Card") {
      const { nameOnAccount, accountNumber, bankName, routingNumber, cardholderName, billingAddress, billingZipCode } = data;

      // Store only necessary details securely
      const storedPaymentMethods = {
        nameOnAccount,
        accountNumber,
        routingNumber,
        cardholderName,
        billingAddress,
        billingZipCode,
      };

      await userProfile.update({
        storedPaymentMethods,
        bankName, // Store separately
      });

      return res.json({ success: true, message: 'Bank & Card information updated successfully.' });
    }

    if (paymentType === "GCash") {
      const { gcashMobileNumber } = data;

      await userProfile.update({
        gcashMobileNumber,
      });

      return res.json({ success: true, message: 'GCash information updated successfully.' });
    }

    return res.status(400).json({ message: 'Invalid payment type.' });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE endpoint to remove payment method data with raw queries only for Tenants
router.delete('/payment-method', async (req, res) => {
  try {
    const { userProfileId, paymentType } = req.body;

    if (!userProfileId || !paymentType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const userProfile = await UserProfile.findByPk(userProfileId);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    if (paymentType === "Bank & Card") {
      await UserProfile.update(
        { storedPaymentMethods: null, bankName: null },
        { where: { id: userProfileId } }
      );
    } else if (paymentType === "GCash") {
      await UserProfile.update(
        { gcashMobileNumber: null },
        { where: { id: userProfileId } }
      );
    } else {
      return res.status(400).json({ message: "Invalid payment type." });
    }

    res.json({ success: true, message: "Payment method removed successfully." });
  } catch (error) {
    console.error("Error removing payment method:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST endpoint to create a new user profile
// In userProfileRoutes.js
// In userProfileRoutes.js
router.post('/welcome', async (req, res) => {
  try {
    const { name, phoneNumber, dateofBirth, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email, and Password are required" });
    }

    // Simply create a new user profile
    const newProfile = await UserProfile.create({
      name,
      phoneNumber,
      dateofBirth,
      email,
      password,
    });

    // Update the corresponding tenant's user_id if email matches
    const [updatedTenant] = await sequelize.query(
      `
      UPDATE "Tenants"
      SET user_id = :userId
      WHERE email = :email
      RETURNING *;
      `,
      {
        replacements: { userId: newProfile.id, email },
        type: sequelize.QueryTypes.UPDATE,
      }
    );


    res.status(201).json({ message: "Profile created successfully", userProfile: newProfile });
  } catch (error) {
    console.error("Error creating profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// When a new tenant registers, check for an existing Tenants row with the same email and update it.
router.post('/register', async (req, res) => {
  try {
    const { email, name, role, password } = req.body;
    if (!email || !name || !role || !password) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Check if a user already exists with this email
    let existingProfile = await UserProfile.findOne({ where: { email } });
    if (existingProfile) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    // Create the new userProfile (for tenants, role would be 'tenant')
    const newProfile = await UserProfile.create({
      email,
      name,
      role,
      password, // remember to hash in production
    });

    // Attempt to unify with a Tenants record that has the same email
    const tenantRecord = await Tenant.findOne({ where: { email } });
    if (tenantRecord && !tenantRecord.userProfileId) {
      // Update the tenant record so that it “belongs” to this newly registered user
      await tenantRecord.update({ userProfileId: newProfile.id });
    }

    return res.status(201).json({ message: 'Registration successful.', userProfile: newProfile });
  } catch (err) {
    console.error('Error in register route:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// GET endpoint to check if profile exists in userProfile table
router.get('/existing', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    const profile = await UserProfile.findOne({ where: { email } });
    // Check that all required fields exist and are non-empty
    if (profile &&
        profile.name &&
        profile.phoneNumber &&
        profile.dateofBirth &&
        profile.email &&
        profile.password
      ) {
      return res.json({ exists: true, userProfile: profile });
    } else {
      return res.json({ exists: false });
    }
  } catch (error) {
    console.error("Error checking profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET endpoint to retrieve user profile by email
router.get('/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const profile = await UserProfile.findOne({ where: { email } });
    if (!profile) {
      return res.json({ userProfile: null }); // or return 404 if you prefer
    }
    res.json({ userProfile: profile });
  } catch (error) {
    console.error('Error fetching userProfile by email:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET endpoint to retrieve user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }

    const profile = await UserProfile.findByPk(id);
    if (!profile) {
      return res.status(404).json({ message: 'UserProfile not found.' });
    }
    res.json(profile);
  } catch (error) {
    console.error('Error fetching userProfile by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/get-landlord-bank/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await UserProfile.findByPk(userId, {
      attributes: ['landlordBankId', 'bankName'],
    });

    if (!user || !user.landlordBankId) {
      return res.status(404).json({ message: 'Landlord bank details not found.' });
    }

    res.json({ landlordBankId: user.landlordBankId, bankName: user.bankName });
  } catch (error) {
    console.error('Error fetching landlord bank details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/register-bank', async (req, res) => {
  try {
    const { userId, bankName } = req.body;

    if (!userId || !bankName) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Find the user's profile
    const userProfile = await UserProfile.findByPk(userId);
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    let landlordBankId;

    if (WISE_API_URL && WISE_API_KEY) {
      try {
        // Call Wise API to create a secure bank account ID
        const response = await axios.post(
          `${WISE_API_URL}/v1/accounts`,
          {
            accountHolderName: userProfile.name,
            currency: "PHP",
            country: "PH",
            type: "bank",
            details: { bankName },
          },
          {
            headers: {
              Authorization: `Bearer ${WISE_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        );

        // Extract the secure bank account ID from Wise response
        landlordBankId = response.data.id;
        console.log('Successfully registered bank via Wise:', landlordBankId);
      } catch (apiError) {
        console.error('Wise API error:', apiError.response ? apiError.response.data : apiError);
        return res.status(500).json({ message: 'Failed to register bank with Wise.' });
      }
    } else {
      // Mock Wise API response (Fallback for local development)
      landlordBankId = `bank_${Date.now()}`;
      console.log('Using mock bank ID:', landlordBankId);
    }

    // Store the bank ID & name securely in UserProfile
    await UserProfile.update(
      { landlordBankId, bankName },
      { where: { id: userId } }
    );

    return res.json({
      success: true,
      message: 'Bank registered successfully!',
      landlordBankId,
    });
  } catch (error) {
    console.error('Error registering bank:', error);
    return res.status(500).json({ message: 'Failed to register bank.' });
  }
});

// PUT endpoint to update user profile by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }

    const { name, phoneNumber, dateofBirth, email, password } = req.body;

    const profile = await UserProfile.findByPk(id);
    if (!profile) {
      return res.status(404).json({ message: 'UserProfile not found.' });
    }

    // Overwrite fields
    profile.name = name;
    profile.phoneNumber = phoneNumber;
    profile.dateofBirth = dateofBirth;
    profile.email = email;
    profile.password = password; 
    // In production, hash password with bcrypt, etc.

    await profile.save();
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Error updating userProfile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid UUID format' });
    }

    const profile = await UserProfile.findByPk(id);

    if (!profile) {
      return res.status(404).json({ message: 'UserProfile not found.' });
    }

    // Delete the record from the database
    await profile.destroy();

    res.json({ message: 'UserProfile deleted successfully.' });
  } catch (error) {
    console.error('Error deleting userProfile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/remove-bank', async (req, res) => {
  try {
    const { userProfileId } = req.body;

    if (!userProfileId) {
      return res.status(400).json({ message: "UserProfile ID is required." });
    }

    const userProfile = await UserProfile.findByPk(userProfileId);
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    await UserProfile.update(
      { landlordBankId: null, bankName: null },
      { where: { id: userProfileId } }
    );

    res.json({ message: "Bank details removed successfully." });
  } catch (error) {
    console.error("Error removing bank details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});



module.exports = router;
