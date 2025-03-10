require('dotenv').config({ path: './backend/.env' });
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY);
const { UserProfile, Files } = require('../models');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BASE_URL = process.env.REACT_APP_API_URL;
const AWS = require('aws-sdk');

// Local storage configuration using diskStorage
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'proof_uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const uploadLocal = multer({ storage: localStorage });

// For AWS S3, use memoryStorage
const uploadMemory = multer({ storage: multer.memoryStorage() });
let s3;
if (process.env.STORAGE_TYPE === 'aws') {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
}

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

// 3) Fetch Landlord Bank Details (for Bank Transfer) – for Wise usage
router.get('/get-landlord-bank/:billId', async (req, res) => {
  try {
    const { billId } = req.params;
    if (!billId) {
      return res.status(400).json({ message: 'Bill ID is required.' });
    }

    const fileRecord = await Files.findByPk(billId, {
      attributes: ['landlordBankDetails']
    });

    if (!fileRecord) {
      return res.status(404).json({ message: 'Bill not found.' });
    }

    if (!fileRecord.landlordBankDetails) {
      return res.status(404).json({ message: "No landlord bank details stored in this bill." });
    }

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
    const { bankName, accountNumber, accountName, routingNumber, swiftCode, currency, country } = req.body;
    
    // Basic validation: require accountNumber, accountName, currency, country and one of routingNumber or swiftCode.
    if (!accountNumber || !accountName || !currency || !country || (!routingNumber && !swiftCode)) {
      return res.status(400).json({ message: "Missing required bank details." });
    }
    
    let recipientData = {};
    
    // For PHP transfers, force use of routingNumber and sort_code even if a swift code is provided.
    if (currency === "PHP") {
      if (!routingNumber) {
        return res.status(400).json({ message: "Routing number is required for PHP transfers." });
      }
      recipientData = {
        accountHolderName: accountName,
        currency: currency, // "PHP"
        type: "sort_code",
        country: country,   // ISO alpha-2, e.g., "PH"
        details: {
          sortCode: routingNumber,
          accountNumber: accountNumber,
          legalType: "PRIVATE",
        },
      };
    } else if (swiftCode) {
      // For non-PHP currencies, if swiftCode is provided, use swift_code type.
      recipientData = {
        accountHolderName: accountName,
        currency: currency,
        type: "swift_code",
        country: country,
        details: {
          bic: swiftCode,
          accountNumber: accountNumber,
          legalType: "PRIVATE",
        },
      };
    } else {
      // Otherwise, use routing number.
      recipientData = {
        accountHolderName: accountName,
        currency: currency,
        type: "sort_code",
        country: country,
        details: {
          sortCode: routingNumber,
          accountNumber: accountNumber,
          legalType: "PRIVATE",
        },
      };
    }
    
    console.log("Creating Wise recipient with payload:", recipientData);
    // Optionally, if you want to include bankName as extra info, you can add it, but Wise API may ignore it.
    recipientData.bankName = bankName;

    const wiseResponse = await axios.post(
      "https://api.sandbox.transferwise.tech/v1/accounts" || "https://api.transferwise.com/v1/accounts",
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
    console.error("Error creating Wise recipient:", error.response?.data || error);
    return res.status(500).json({ message: "Internal server error." });
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
      "https://api.sandbox.transferwise.tech/v1/quotes" || "https://api.transferwise.com/v1/quotes",
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
      "https://api.sandbox.transferwise.tech/v1/transfers" || "https://api.transferwise.com/v1/transfers",
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
      `https://api.sandbox.transferwise.tech/v1/transfers/${transferResponse.data.id}/payments` || 
      `https://api.transferwise.com/v1/transfers/${transferResponse.data.id}/payments`,
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
    console.error("Error processing Wise transfer:", error.response?.data || error);
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

// ================== Proof of Payments ==================
router.post('/upload-proof', async (req, res) => {
  if (process.env.STORAGE_TYPE === 'aws') {
    uploadMemory.single('file')(req, res, async function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({ success: false, message: "File upload error", error: err });
      }
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
      }
      const fileExtension = path.extname(file.originalname).slice(1);
      const fileName = `${Date.now()}-${file.originalname}`;
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      try {
        const s3Response = await s3.upload(params).promise();
        const fileUrl = s3Response.Location;
        const newFile = await Files.create({
          fileName: req.body.fileName, // Provided from formData
          fileType: fileExtension,
          url: fileUrl,
          subject: req.body.subject,
          billId: req.body.billId,
          landlordEmail: req.body.landlordEmail
        });
        return res.json({ success: true, fileRecord: newFile });
      } catch (uploadErr) {
        console.error("S3 upload error:", uploadErr);
        return res.status(500).json({ success: false, message: "S3 upload error", error: uploadErr.message });
      }
    });
  } else {
    // Local storage branch
    uploadLocal.single('file')(req, res, async function (err) {
      if (err) {
        console.error("File upload error:", err);
        return res.status(400).json({ success: false, message: "File upload error", error: err });
      }
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
      }
      const fileExtension = path.extname(file.originalname).slice(1);
      const fileUrl = `${process.env.REACT_APP_API_URL}/proof_uploads/${file.filename}`;
      try {
        const newFile = await Files.create({
          fileName: req.body.fileName,
          fileType: fileExtension,
          url: fileUrl,
          subject: req.body.subject,
          billId: req.body.billId,
          landlordEmail: req.body.landlordEmail
        });
        return res.json({ success: true, fileRecord: newFile });
      } catch (dbErr) {
        console.error("Error saving file record:", dbErr);
        return res.status(500).json({ success: false, message: "Error saving file record", error: dbErr.message });
      }
    });
  }
});

module.exports = router;
