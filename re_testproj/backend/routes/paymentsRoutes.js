require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY);
const { UserProfile, Files } = require('../models');
const axios = require('axios');
const BASE_URL = process.env.REACT_APP_API_URL;

// 1) Fetch Tenant Payment Methods (unchanged)
router.get('/user-payment-methods/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const userProfile = await UserProfile.findByPk(userId);
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.json({
      storedPaymentMethods: userProfile.storedPaymentMethods || null,
      gcashMobileNumber: userProfile.gcashMobileNumber || null,
      bankName: userProfile.bankName || null,
    });
  } catch (error) {
    console.error('Error fetching user payment methods:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2) Fetch Landlord Basic Data (GCash / Bank ID) – for GCash usage
router.get('/get-landlord-details/:landlordId', async (req, res) => {
  try {
    const { landlordId } = req.params;
    if (!landlordId) {
      return res.status(400).json({ message: 'Landlord ID is required.' });
    }

    const landlordProfile = await UserProfile.findByPk(landlordId);
    if (!landlordProfile) {
      return res.status(404).json({ message: 'Landlord profile not found.' });
    }

    // This is still used for GCash 
    return res.json({
      landlordBankId: landlordProfile.landlordBankId || null,
      landlordGcashMobileNumber: landlordProfile.landlordGcashMobileNumber || null,
    });
  } catch (error) {
    console.error('Error fetching landlord details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/* 
  3) NEW/UPDATED: 
  Instead of reading from userProfile for Wise, we read from Files table.
  We assume each "bill" in Files has "landlordBankDetails" JSON storing 
  bankName, accountNumber, routingNumber, swiftCode, etc.

  Call from front-end: GET /api/payments/get-landlord-bank/:billId
*/
router.get('/get-landlord-bank/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    if (!billId) {
      return res.status(400).json({ message: 'Bill ID is required.' });
    }

    // We find the "bill" in the Files table
    const fileRecord = await Files.findByPk(billId, {
      attributes: ['landlordBankDetails']
    });

    if (!fileRecord) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (!fileRecord.landlordBankDetails) {
      return res.status(404).json({ message: "No landlord bank details stored in this bill." });
    }

    // Return the landlord's bank details from the Files table
    return res.json({
      success: true,
      bankDetails: fileRecord.landlordBankDetails, 
    });
  } catch (error) {
    console.error('Error fetching landlord bank details from Files:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== GCash Endpoints (unchanged) ====================
router.post('/gcash', async (req, res) => {
  try {
    const { billId, amount, tenantEmail } = req.body;
    if (!billId || !amount || !tenantEmail) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    console.log("Creating GCash Source in PayMongo:", { amount, billId, tenantEmail });

    const successUrl = `${BASE_URL}/api/payments/payment-success?billId=${billId}`;
    const failedUrl = `${BASE_URL}/api/payments/payment-failed?billId=${billId}`;

    const paymongoResponse = await axios.post('https://api.paymongo.com/v1/sources', {
      data: {
        attributes: {
          amount,
          redirect: { success: successUrl, failed: failedUrl },
          type: 'gcash',
          currency: 'PHP'
        }
      }
    }, {
      headers: { 
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paymongoResponse.data || !paymongoResponse.data.data) {
      return res.status(500).json({ message: "Error creating PayMongo source." });
    }

    res.json({ 
      success: true, 
      checkoutUrl: paymongoResponse.data.data.attributes.redirect.checkout_url,
      sourceId: paymongoResponse.data.data.id 
    });
  } catch (error) {
    console.error("Error creating GCash payment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/gcash-status", async (req, res) => {
  try {
    const { sourceId } = req.body;
    if (!sourceId) {
      return res.status(400).json({ message: "Source ID is required." });
    }

    const response = await axios.get(`https://api.paymongo.com/v1/sources/${sourceId}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY).toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    const status = response.data.data.attributes.status;
    return res.json({ status });
  } catch (error) {
    console.error("Error fetching GCash payment status:", error);
    return res.status(500).json({ message: "Error fetching payment status." });
  }
});

// (Not in use)
router.post('/gcash-webhook', async (req, res) => {
  try {
    const event = req.body;
    if (!event || !event.data) {
      return res.status(400).json({ message: 'Invalid webhook data.' });
    }

    const eventType = event.data.type;
    const sourceId = event.data.id;
    const status = event.data.attributes.status;

    if (eventType === 'source.chargeable' && status === 'chargeable') {
      const billId = new URL(event.data.attributes.redirect.success).searchParams.get('billId');

      if (!billId) {
        return res.status(400).json({ message: 'Bill ID missing from redirect URL.' });
      }

      await Files.update({ paid: true }, { where: { id: billId } });
      return res.json({ success: true, message: 'Payment recorded successfully.' });
    }

    res.status(400).json({ message: 'Payment not chargeable yet.' });
  } catch (error) {
    console.error('Error processing PayMongo webhook:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ==================== Wise Bank Transfer Endpoints ====================
router.post("/wise-create-recipient", async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, routingNumber, currency } = req.body;
    if (!bankName || !accountNumber || !accountName || !routingNumber || !currency) {
      return res.status(400).json({ message: "Missing required bank details." });
    }

    // Example: Using TransferWise's API
    const recipientData = {
      accountHolderName: accountName,
      currency: currency,
      type: "sort_code",
      details: {
        sortCode: routingNumber,
        accountNumber: accountNumber,
        legalType: "PRIVATE",
      },
    };

    const wiseResponse = await axios.post(
      "https://api.sandbox.transferwise.tech/v1/accounts",
      recipientData,
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!wiseResponse.data || !wiseResponse.data.id) {
      return res.status(500).json({ message: "Failed to create Wise recipient." });
    }

    return res.json({ success: true, recipientId: wiseResponse.data.id });
  } catch (error) {
    console.error("Error creating Wise recipient:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/wise-transfer", async (req, res) => {
  try {
    const { amount, currency, recipientId } = req.body;
    if (!amount || !currency || !recipientId) {
      return res.status(400).json({ message: "Missing required payment details." });
    }

    // Step 1: Create a transfer quote
    const quoteResponse = await axios.post(
      "https://api.sandbox.transferwise.tech/v1/quotes",
      {
        profile: process.env.WISE_PROFILE_ID,
        source: currency,
        target: currency,
        targetAmount: amount,
        payOut: "BANK_TRANSFER",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!quoteResponse.data || !quoteResponse.data.id) {
      return res.status(500).json({ message: "Failed to create Wise quote." });
    }

    // Step 2: Create a transfer
    const transferResponse = await axios.post(
      "https://api.sandbox.transferwise.tech/v1/transfers",
      {
        targetAccount: recipientId,
        quote: quoteResponse.data.id,
        customerTransactionId: `txn_${Date.now()}`,
        details: { reference: "Rent Payment" },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!transferResponse.data || !transferResponse.data.id) {
      return res.status(500).json({ message: "Failed to create Wise transfer." });
    }

    // Step 3: Fund the transfer
    const fundResponse = await axios.post(
      `https://api.sandbox.transferwise.tech/v1/transfers/${transferResponse.data.id}/payments`,
      { type: "BALANCE" },
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!fundResponse.data || fundResponse.data.status !== "COMPLETED") {
      return res.status(500).json({ message: "Failed to fund Wise transfer." });
    }

    return res.json({ success: true, message: "Wise transfer completed successfully!" });
  } catch (error) {
    console.error("Error processing Wise transfer:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// ================== Update Bill Payment Status ==================
router.post("/update-status", async (req, res) => {
  try {
    const { billId, status } = req.body;
    if (!billId || !status) {
      return res.status(400).json({ message: "billId and status are required." });
    }

    const bill = await Files.findByPk(billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    bill.paid = (status === "Paid");
    await bill.save();

    return res.json({ success: true, message: `Bill marked as ${status}.` });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ message: "Error updating payment status." });
  }
});

// ================== PayMongo Redirects ==================
router.get('/payment-success', async (req, res) => {
  try {
    const { billId } = req.query;
    if (!billId) {
      return res.status(400).json({ message: 'Missing billId.' });
    }

    await Files.update({ paid: true }, { where: { id: billId } });
    return res.redirect(`${process.env.FRONTEND_BASE_URL}/tenant/dashboard?paymentStatus=success&redirected=true`);
  } catch (error) {
    console.error('Error processing payment success:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/payment-failed', (req, res) => {
  return res.redirect(`${process.env.FRONTEND_BASE_URL}/tenant/dashboard?paymentStatus=failed&redirected=true`);
});

module.exports = router;
