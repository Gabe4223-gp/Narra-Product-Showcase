require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const router = express.Router();
const { UserProfile, Files, sequelize} = require('../models');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8);
const { v4: uuidv4 } = require('uuid');

function generateCustomerTransactionId() {
  const prefix = 'WSTX'; // fixed prefix to ensure the id starts with a letter
  const timestampPart = Date.now().toString().slice(-6); // last 6 digits of the current timestamp
  const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0'); // a 6-digit random number
  // Concatenate and ensure the total length is no more than 20 characters
  return (prefix + timestampPart + randomPart).slice(0, 20);
}

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

// ==================== GCash Endpoints (unchanged) ====================
router.post('/gcash', async (req, res) => {
  try {
    const { billId, amount, tenantEmail } = req.body;
    if (!billId || !amount || !tenantEmail) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    console.log("Creating GCash Source in PayMongo:", { amount, billId, tenantEmail });

    const successUrl = `${BASE_URL}/api/payments/payment-success?billId=${billId}&tenantEmail=${encodeURIComponent(tenantEmail)}`;
    const failedUrl = `${BASE_URL}/api/payments/payment-failed?billId=${billId}`;
    const BASE_URL = process.env.REACT_APP_API_URL_PROD === "production"
      ? "https://narra-ph.com"
      : "http://localhost:3000";
    
    const returnUrl = `${BASE_URL}/tenant/dashboard?redirected=true`;

    const paymongoResponse = await axios.post('https://api.paymongo.com/v1/sources', {
      data: {
        attributes: {
          amount,
          redirect: { 
            success: successUrl,
            failed: failedUrl
          },
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
    
    // Use the checkout URL as-is (no manual modifications)
    res.json({ 
      success: true, 
      checkoutUrl: paymongoResponse.data.data.attributes.redirect.checkout_url, // No modifications
      sourceId: paymongoResponse.data.data.id 
    });    
  } catch (error) {
    console.error("Error creating GCash payment:", error);

    // Check if error.response exists (i.e., error is from the API call)
    if (error.response) {
      // Capture specific response data for a 400 error or other statuses
      console.error("Error response data:", error.response.data); 
      
      // Send a more specific response if it's a 400 error
      if (error.response.status === 400) {
        return res.status(400).json({
          message: "Bad request: " + (error.response.data.message || "Invalid request parameters."),
          details: error.response.data
        });
      }
      
      // Handle other status codes as necessary
      return res.status(error.response.status).json({
        message: error.response.data.message || "Error with PayMongo API request.",
        details: error.response.data
      });
    }

    // Fallback for non-response errors (e.g., network issues)
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

router.get("/wise-balance", async (req, res) => {
  try {
    const { tenantId } = req.query;
    if (!tenantId) {
      return res.status(400).json({ message: "tenantId is required." });
    }
    // Simulated balance for testing purposes.
    const simulatedBalance = 1000; // e.g., USD 1000
    return res.json({ balance: simulatedBalance });
  } catch (error) {
    console.error("Error fetching Wise balance:", error.response?.data || error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/wise-create-recipient", async (req, res) => {
  try {
    // Destructure values from req.body using let so they can be reassigned.
    let {
      transferType,
      legalType,
      bankName,
      accountNumber,
      accountName,
      routingNumber,
      swiftCode,
      currency,
      country,
      address,
      institutionNumber,
      transitNumber
    } = req.body;    

    // ====== VALIDATION ======
    const requiredFields = {
      BankTransfer: ['accountNumber', 'routingNumber'],
      SWIFT: ['accountNumber', 'swiftCode'],
      Wire: ['accountNumber', 'swiftCode'],
      WiseBalance: [] // No recipient needed
    };

    if (!requiredFields[transferType]) {
      return res.status(400).json({ message: "Invalid transfer type" });
    }

    const missing = requiredFields[transferType].filter(f => !req.body[f]);
    if (missing.length > 0) {
      return res.status(400).json({
        message: `Missing required fields for ${transferType}: ${missing.join(', ')}`
      });
    }

    // ====== SANDBOX OVERRIDES ======
    const isSandbox = process.env.NODE_ENV !== 'production';
    let processedCurrency = currency.toUpperCase();
    
    if (isSandbox) {
      processedCurrency = 'USD';
      if (transferType === 'BankTransfer') {
        accountNumber = '123456789';
        routingNumber = '084009519';
      }
      // Override the address object entirely for sandbox testing
      address = {
        firstLine: "456 Sandbox Ave",
        city: "New York",
        state: "NY",       // Explicitly include state
        postCode: "10001",
        country: "US"
      };
      // (Optional) Remove transitNumber if present in the incoming payload
      transitNumber = undefined;
    }

    // ====== RECIPIENT CONSTRUCTION ======
    // Build the base recipient data. We include a nested address with a state.
    let recipientData = {
      accountHolderName: accountName,
      currency: processedCurrency,
      country: country,
      details: {
        legalType: legalType || 'PRIVATE',
        address: {
          firstLine: address?.firstLine || '123 Default Street',
          city: address?.city || 'Manila',
          state: address?.state || 'NY', // Provide a default state if missing
          postCode: address?.postCode || '1000',
          country: address?.country || country
        }
      }
    };

    // Transfer Type Specifics
    switch(transferType) {
      case 'BankTransfer':
        recipientData.type = 'aba';
        recipientData.details = {
          ...recipientData.details,
          abartn: routingNumber,
          accountNumber: accountNumber,
          accountType: 'CHECKING'
        };
        // If country is Canada, you might add additional fields.
        // if (country === 'CA') {
        //   recipientData.details.transitNumber = transitNumber;
        //   recipientData.details.institutionNumber = institutionNumber;
        // }
        break;

      case 'SWIFT':
      case 'Wire':
        recipientData.type = 'swift';
        recipientData.details = {
          ...recipientData.details,
          bic: swiftCode,
          accountNumber: accountNumber
        };
        if (country === 'PH') {
          recipientData.details.bankCode = bankName; // For Philippine banks
        }
        break;
      // For WiseBalance, no additional recipient details are needed.
    }

    // ====== FINAL PAYLOAD ======
    // Use finalPayload as our variable that we'll send to Wise.
    let finalPayload = { ...recipientData };

    // In sandbox mode, override or add any additional required fields.
    if (isSandbox) {
      finalPayload.currency = "USD";
      if (transferType === "BankTransfer") {
        // Override account credentials with test values.
        finalPayload.details.accountNumber = "123456789";
        finalPayload.details.abartn = "084009519";
      }
      // Override the address to ensure it has a valid state.
      finalPayload.details.address = {
        firstLine: "456 Sandbox Ave",
        city: "New York",
        state: "NY",
        postCode: "10001",
        country: "US"
      };
      // Remove transitNumber if it somehow exists in finalPayload.
      if (finalPayload.transitNumber) {
        delete finalPayload.transitNumber;
      }
    }

    console.log("Final Payload to send to Wise:", JSON.stringify(finalPayload, null, 2));

    // ====== WISE API CALL ======
    const wiseEndpoint = isSandbox 
      ? 'https://api.sandbox.transferwise.tech/v1/accounts'
      : 'https://api.transferwise.com/v1/accounts';

    const wiseResponse = await axios.post(wiseEndpoint, finalPayload, {
      headers: {
        Authorization: `Bearer ${process.env.WISE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      success: true,
      recipientId: wiseResponse.data.id,
      sandboxOverrides: isSandbox ? {
        accountNumber: accountNumber,
        routingNumber: routingNumber
      } : null
    });

  } catch (error) {
    if (error.response) {
      console.error("Wise Recipient Creation Error:", JSON.stringify(error.response.data, null, 2));
      console.error("Status:", error.response.status);
      console.error("Headers:", JSON.stringify(error.response.headers, null, 2));
    } else {
      console.error("Error creating recipient:", error.message);
    }
    res.status(500).json({
      message:
        error.response?.data?.errors?.[0]?.message ||
        "Recipient creation failed",
      code: error.response?.data?.errors?.[0]?.code,
    });
  }
});

router.post("/wise-transfer", async (req, res) => {
  try {
    const { amount, currency, transferType } = req.body;
    // Optionally, recipientId may be provided; if not, we'll create one.
    let { recipientId } = req.body;
    const isSandbox = process.env.NODE_ENV !== 'production';
    const profileId = process.env.WISE_PROFILE_ID;
    
    // If no recipientId is provided, dynamically create one
    if (!recipientId) {
      // Build recipient payload with the profile field added
      const recipientPayload = {
        profile: profileId,  // Ensure the recipient is created under the correct profile
        transferType: "BankTransfer", // or use transferType from req.body if applicable
        legalType: "BUSINESS",        // adjust as needed
        bankName: "BDO Unibank",        // example value; adjust as needed
        accountNumber: isSandbox ? "123456789" : req.body.accountNumber,
        accountName: "Narra",           // example value; adjust as needed
        routingNumber: isSandbox ? "084009519" : req.body.routingNumber,
        swiftCode: req.body.swiftCode || "",
        currency: isSandbox ? "USD" : currency,
        country: "US",
        address: {
          firstLine: "456 Sandbox Ave",
          city: "New York",
          state: "NY",
          postCode: "10001",
          country: "US"
        }
      };

      // Call the /wise-create-recipient endpoint on your server
      const recipientResponse = await axios.post(
        "http://localhost:3000/api/payments/wise-create-recipient",
        recipientPayload,
        {
          headers: { "Content-Type": "application/json" }
        }
      );

      if (recipientResponse.data.success && recipientResponse.data.recipientId) {
        recipientId = recipientResponse.data.recipientId;
        console.log("Dynamically retrieved recipientId:", recipientId);
      } else {
        throw new Error("Failed to create recipient: " + recipientResponse.data.message);
      }
    }

    // ====== CURRENCY HANDLING ======
    const sourceCurrency = isSandbox ? 'USD' : currency.toUpperCase();
    const targetCurrency = isSandbox ? 'USD' : currency.toUpperCase();

    // ====== QUOTE CREATION ======
    const quoteData = {
      profile: profileId,
      source: sourceCurrency,
      target: targetCurrency,
      rateType: 'FIXED'
    };

    if (isSandbox) {
      quoteData.sourceAmount = amount;
    } else {
      quoteData.targetAmount = amount;
    }

    const quoteResponse = await axios.post(
      isSandbox
        ? 'https://api.sandbox.transferwise.tech/v1/quotes'
        : 'https://api.transferwise.com/v1/quotes',
      quoteData,
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // ====== TRANSFER CREATION ======
    const customerTransactionId = uuidv4(); // Standard UUID with hyphens

    // Truncate reference if needed
    const rawReference = "Rent Payment";
    const maxReferenceLength = 10;
    const truncatedReference = rawReference.substring(0, maxReferenceLength);

    const transferPayload = {
      targetAccount: recipientId,  // dynamically retrieved recipient ID
      quote: quoteResponse.data.id, // Use "quote" per Wise docs
      customerTransactionId,
      details: {
        reference: truncatedReference,
        transferPurpose: "verification.transfers.purpose.pay.bills"
      },
      accountHolder: {
        name: process.env.COMPANY_NAME || 'Your Business',
        type: 'BUSINESS',
        address: {
          country: isSandbox ? 'US' : 'PH',
          postCode: isSandbox ? '10001' : '1000',
          city: isSandbox ? 'New York' : 'Manila',
          firstLine: isSandbox ? '456 Sandbox Ave' : 'Your Business Address'
        }
      }
    };

    console.log("Transfer Payload:", JSON.stringify(transferPayload, null, 2));

    const transferResponse = await axios.post(
      isSandbox
        ? 'https://api.sandbox.transferwise.tech/v1/transfers'
        : 'https://api.transferwise.com/v1/transfers',
      transferPayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // ====== FUNDING (SANDBOX SIMULATION) ======
    if (isSandbox) {
      await axios.post(
        `https://api.sandbox.transferwise.tech/v1/simulation/transfers/${transferResponse.data.id}/fund`,
        {},
        {
          headers: { Authorization: `Bearer ${process.env.WISE_API_KEY}` }
        }
      );
    }

    res.json({
      success: true,
      transferId: transferResponse.data.id,
      amount: quoteResponse.data.sourceAmount,
      fee: quoteResponse.data.fee,
      rate: quoteResponse.data.rate
    });

  } catch (error) {
    if (error.response) {
      console.error("Transfer Error Details:", JSON.stringify(error.response.data, null, 2));
      console.error("Transfer Error Status:", error.response.status);
      console.error("Transfer Error Headers:", JSON.stringify(error.response.headers, null, 2));
    } else {
      console.error("Transfer Error:", error.message);
    }
    res.status(500).json({
      message: error.response?.data?.errors?.[0]?.message || 'Transfer failed',
      code: error.response?.data?.errors?.[0]?.code
    });
  }
});

router.post("/wise-balance-transfer", async (req, res) => {
  try {
    const { sourceBalanceId, targetBalanceId, amount } = req.body;
    const isSandbox = process.env.NODE_ENV !== 'production';

    // ====== BALANCE VALIDATION ======
    const balanceCheck = await axios.get(
      `https://api.${isSandbox ? 'sandbox.' : ''}transferwise.tech/v1/balances`,
      {
        headers: { Authorization: `Bearer ${process.env.WISE_API_KEY}` } // Fixed closing braces
      }
    );

    const validSource = balanceCheck.data.some(b => b.id === sourceBalanceId);
    const validTarget = balanceCheck.data.some(b => b.id === targetBalanceId);

    if (!validSource || !validTarget) {
      return res.status(400).json({ message: "Invalid balance IDs" });
    }

    // ====== DIRECT BALANCE TRANSFER ======
    const transferResponse = await axios.post(
      `https://api.${isSandbox ? 'sandbox.' : ''}transferwise.tech/v1/transfers`,
      {
        sourceBalance: sourceBalanceId,
        targetBalance: targetBalanceId,
        amount: amount,
        currency: isSandbox ? 'USD' : 'PHP'
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WISE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      transferId: transferResponse.data.id,
      newBalance: transferResponse.data.sourceBalanceAmount - amount
    });

  } catch (error) {
    console.error('Balance Transfer Error:', error.response?.data || error);
    res.status(500).json({
      message: error.response?.data?.errors?.[0]?.message || 'Balance transfer failed'
    });
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
      const { billId, tenantEmail } = req.query;

      if (!billId) {
          return res.status(400).json({ message: 'Missing billId.' });
      }

      // Mark the bill as paid and fetch the updated record
      await Files.update({ paid: true }, { where: { id: billId } });

      // Fetch the updated bill details separately
      const updatedFile = await Files.findOne({ where: { id: billId } });

      if (!updatedFile) {
        throw new Error("Bill not found");
      }

      // Fetch the property details
      const propQuery = `SELECT * FROM "Properties" WHERE id = :propertyId`;
      const [propertyResults] = await sequelize.query(propQuery, {
        replacements: { propertyId: updatedFile.propertyId }, // Corrected typo
        type: sequelize.QueryTypes.SELECT, // Fetching a record
      });

      // Ensure property exists
      if (!propertyResults) {
        throw new Error("Property not found");
      }

      // Insert a notification for the landlord
      const notificationQuery = `
        INSERT INTO "Notifications" ("id", "user_id", "message", "type", "created_at")
        SELECT 
          gen_random_uuid(), 
          :user_id,  
          CONCAT(up."name", ' from ', :propertyName, ' has paid ', :totalAmount, ' on the bill due ', :deadline), 
          'bill', 
          NOW()
        FROM "userProfile" up
        WHERE up."email" = :tenantEmail  
        RETURNING *;
      `;

      // Execute notification query
      const result = await sequelize.query(notificationQuery, {
        replacements: {
          user_id: updatedFile.landlordId,    // Correctly fetched landlord ID
          totalAmount: updatedFile.totalAmount,
          deadline: updatedFile.deadline,
          tenantEmail,  // Ensure this is defined earlier
          propertyName: propertyResults.propertyName // Correct way to access property name
        },
        type: sequelize.QueryTypes.INSERT,
      });

      // Redirect back to Tenant Dashboard & Force Reload Billing
      return res.redirect(`https://narra-ph.com/tenant/dashboard?paymentStatus=success&redirected=true`); //fixed to narra-ph.com for testing
  } catch (error) {
    console.error('Error processing payment success:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/payment-failed', (req, res) => {
  return res.redirect(`https://narra-ph.com/tenant/dashboard?paymentStatus=failed&redirected=true`); //fixed to narra-ph.com for testing
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
