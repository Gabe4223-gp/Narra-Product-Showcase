// routes/userProfileRoutes.js
const express = require('express');
const router = express.Router();
const { sequelize, UserProfile } = require('../models');

// GET endpoint to retrieve payment method details for editing
router.get('/payment-methods', async (req, res) => {
  try {
    const { userProfileId } = req.query;
    if (!userProfileId) {
      return res.status(400).json({ message: "userProfileId is required." });
    }
    const userProfile = await UserProfile.findByPk(userProfileId);
    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found." });
    }

    // We'll build an array of payment methods. If a specific set of fields is non-empty,
    // we add it to the array as "Debit/Credit Card", "Bank Transfer", or "GCash".
    const paymentMethods = [];

    // 1. Debit/Credit Card
    if (userProfile.cardNumber || userProfile.cvv || userProfile.cardholderName) {
      paymentMethods.push({
        type: "Debit/Credit Card",
        cardholderName: userProfile.cardholderName || "",
        billingAddress: userProfile.billingAddress || "",
        cardNumber: userProfile.cardNumber || "",
        expiryDate: userProfile.expiryDate || "",
        cvv: userProfile.cvv || "",
        billingZipCode: userProfile.billingZipCode || "",
      });
    }

    // 2. Bank Transfer
    if (userProfile.bank || userProfile.accountNumber || userProfile.accountName) {
      paymentMethods.push({
        type: "Bank Transfer",
        bank: userProfile.bank || "",
        accountNumber: userProfile.accountNumber || "",
        accountName: userProfile.accountName || "",
      });
    }

    // 3. GCash
    if (userProfile.gcashMobileNumber) {
      paymentMethods.push({
        type: "GCash",
        gcashMobileNumber: userProfile.gcashMobileNumber || "",
      });
    }

    return res.json({ paymentMethods });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT endpoint to update payment method data with raw queries only for Tenants
router.put('/payment-method', async (req, res) => {
  try {
    const { userProfileId, paymentType, data } = req.body;
    if (!userProfileId) {
      return res.status(400).json({ message: 'UserProfile ID is required.' });
    }
    if (!paymentType || !data) {
      return res.status(400).json({ message: 'Payment type and data are required.' });
    }

    const userProfile = await UserProfile.findByPk(userProfileId);
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    const [tenant] = await sequelize.query(
      'SELECT * FROM "Tenants" WHERE user_id = :userProfileId',
      {
        replacements: { userProfileId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found.' });
    }

    if (paymentType === 'Debit/Credit Card') {
      const { cardholderName, billingAddress, billingZipCode } = data;
      userProfile.cardholderName = cardholderName;
      userProfile.billingAddress = billingAddress;
      userProfile.cardNumber = data.cardNumber;
      userProfile.expiryDate = data.expiryDate;
      userProfile.cvv = data.cvv;
      userProfile.billingZipCode = billingZipCode;

      await userProfile.save();

      await sequelize.query(
        'UPDATE "Tenants" SET "creditCardName" = :cardholderName WHERE user_id = :userProfileId',
        {
          replacements: { cardholderName, userProfileId },
        }
      );
    } else if (paymentType === 'Bank Transfer') {
      const { bank, accountNumber, accountName } = data;
      userProfile.bank = bank;
      userProfile.accountNumber = accountNumber;
      userProfile.accountName = accountName;

      await userProfile.save();

      await sequelize.query(
        'UPDATE "Tenants" SET "bankName" = :bank WHERE user_id = :userProfileId',
        {
          replacements: { bank, userProfileId },
        }
      );
    } else if (paymentType === 'GCash') {
      userProfile.gcashMobileNumber = data.gcashMobileNumber;

      await userProfile.save();

      await sequelize.query(
        'UPDATE "Tenants" SET "eWalletName" = :gcashMobileNumber WHERE user_id = :userProfileId',
        {
          replacements: { gcashMobileNumber: "GCash", userProfileId }, //set to GCash until we offer multiple ewallet methods
        }
      );
    }

    return res.json({ message: 'Payment method updated successfully.' });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// DELETE endpoint to remove payment method data with raw queries only for Tenants
router.delete('/payment-method', async (req, res) => {
  console.log('delete payment method was hit!');
  try {
    const { userProfileId, paymentType } = req.body;
    if (!userProfileId) {
      return res.status(400).json({ message: 'userProfileId is required.' });
    }
    if (!paymentType) {
      return res.status(400).json({ message: 'Payment type is required.' });
    }

    const userProfile = await UserProfile.findByPk(userProfileId);
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    // Clear columns based on paymentType
    if (paymentType === 'Debit/Credit Card') {
      userProfile.cardholderName = null;
      userProfile.billingAddress = null;
      userProfile.cardNumber = null;
      userProfile.expiryDate = null;
      userProfile.cvv = null;
      userProfile.billingZipCode = null;

      await userProfile.save();

      await sequelize.query(
        'UPDATE "Tenants" SET "creditCardName" = NULL WHERE user_id = :userProfileId',
        {
          replacements: { userProfileId },
        }
      );
    } else if (paymentType === 'Bank Transfer') {
      userProfile.bank = null;
      userProfile.accountNumber = null;
      userProfile.accountName = null;

      await userProfile.save();

      await sequelize.query(
        'UPDATE "Tenants" SET "bankName" = NULL WHERE user_id = :userProfileId',
        {
          replacements: { userProfileId },
        }
      );
    } else if (paymentType === 'GCash') {
      userProfile.gcashMobileNumber = null;

      await userProfile.save();

      await sequelize.query(
        'UPDATE "Tenants" SET "eWalletName" = NULL WHERE user_id = :userProfileId',
        {
          replacements: { userProfileId },
        }
      );
    } else {
      return res.status(400).json({ message: 'Invalid payment type.' });
    }

    res.json({ message: 'Payment method removed successfully.' });
  } catch (error) {
    console.error('Error removing payment method:', error);
    res.status(500).json({ message: 'Internal server error' });
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

// PUT endpoint to update user profile by ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
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


module.exports = router;
