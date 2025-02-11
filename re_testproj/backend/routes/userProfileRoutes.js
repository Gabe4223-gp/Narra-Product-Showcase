// routes/userProfileRoutes.js
const express = require('express');
const router = express.Router();
const { UserProfile } = require('../models');

// PUT endpoint to update payment method data
router.put('/payment-method', async (req, res) => {
  try {
    const { userId, paymentType, data } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!paymentType || !["Debit/Credit Card", "Bank Transfer", "GCash"].includes(paymentType)) {
      return res.status(400).json({ message: 'A valid paymentType is required.' });
    }
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ message: 'Data object is required.' });
    }

    // Retrieve the user profile from the database.
    const userProfile = await UserProfile.findByPk(userId);
    if (!userProfile) {
      return res.status(400).json({ message: 'Please set up your profile first in settings.' });
    }

    let updateData = {};

    if (paymentType === "Debit/Credit Card") {
      let { cardholderName, billingAddress, cardNumber, expiryDate, cvv, billingZipCode } = data;
      if (typeof cardholderName !== "string" || !cardholderName.trim()) {
        return res.status(400).json({ message: "Please provide a valid Name on Card." });
      }
      if (isNaN(Number(cardNumber))) {
        return res.status(400).json({ message: "Please provide a valid Card Number." });
      }
      cardNumber = Number(cardNumber);
      if (!Date.parse(expiryDate)) {
        return res.status(400).json({ message: "Please provide a valid Expiry Date." });
      }
      expiryDate = new Date(expiryDate);
      if (isNaN(Number(cvv))) {
        return res.status(400).json({ message: "Please provide a valid CVV." });
      }
      cvv = Number(cvv);

      updateData = { cardholderName, billingAddress, cardNumber, expiryDate, cvv, billingZipCode };
    } else if (paymentType === "Bank Transfer") {
      let { bank, accountNumber, accountName } = data;
      if (typeof bank !== "string" || !bank.trim()) {
        return res.status(400).json({ message: "Please provide a valid Bank." });
      }
      if (isNaN(Number(accountNumber))) {
        return res.status(400).json({ message: "Please provide a valid Account Number." });
      }
      accountNumber = Number(accountNumber);
      updateData = { bank, accountNumber, accountName };
    } else if (paymentType === "GCash") {
      let { gcashMobileNumber } = data;
      if (isNaN(Number(gcashMobileNumber))) {
        return res.status(400).json({ message: "Please provide a valid GCash Mobile Number." });
      }
      gcashMobileNumber = Number(gcashMobileNumber);
      updateData = { gcashMobileNumber };
    }

    await userProfile.update(updateData);
    return res.json({
      message: "Payment method updated successfully.",
      userProfile,
    });
  } catch (error) {
    console.error("Error updating payment method:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

// GET endpoint to retrieve payment method details for editing
router.get('/payment-method', async (req, res) => {
  try {
    const { userId, paymentType } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    if (!paymentType || !["Debit/Credit Card", "Bank Transfer", "GCash"].includes(paymentType)) {
      return res.status(400).json({ message: 'A valid paymentType is required.' });
    }

    const userProfile = await UserProfile.findByPk(userId);
    if (!userProfile) {
      return res.status(400).json({ message: 'Please set up your profile first in settings.' });
    }

    let paymentData = {};
    if (paymentType === "Debit/Credit Card") {
      paymentData = {
        cardholderName: userProfile.cardholderName,
        billingAddress: userProfile.billingAddress,
        cardNumber: userProfile.cardNumber,
        expiryDate: userProfile.expiryDate,
        cvv: userProfile.cvv,
        billingZipCode: userProfile.billingZipCode,
      };
    } else if (paymentType === "Bank Transfer") {
      paymentData = {
        bank: userProfile.bank,
        accountNumber: userProfile.accountNumber,
        accountName: userProfile.accountName,
      };
    } else if (paymentType === "GCash") {
      paymentData = {
        gcashMobileNumber: userProfile.gcashMobileNumber,
      };
    }

    return res.json({ paymentType, paymentData });
  } catch (error) {
    console.error("Error fetching payment method:", error);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
