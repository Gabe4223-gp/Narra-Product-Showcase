require('dotenv').config({ path: './backend/.env' }); // Ensure .env is loaded
const express = require('express');
const router = express.Router();
const { UserProfile, Files, sequelize } = require('../models'); // Sequelize model
const axios = require('axios');
const BASE_URL = process.env.REACT_APP_API_URL;

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

    res.json({
      landlordBankId: landlordProfile.landlordBankId || null,
      landlordGcashMobileNumber: landlordProfile.landlordGcashMobileNumber || null,
    });
  } catch (error) {
    console.error('Error fetching landlord details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/gcash', async (req, res) => {
  try {
    const { billId, amount, tenantEmail } = req.body;

    if (!billId || !amount || !tenantEmail) {
      console.error("Error: Missing required fields:", { billId, amount, tenantEmail });
      return res.status(400).json({ message: "Missing required fields." });
    }

    console.log("Creating GCash Source in PayMongo:", { amount, billId, tenantEmail });

    const successUrl = `${BASE_URL}/api/payments/payment-success?billId=${billId}&tenantEmail=${encodeURIComponent(tenantEmail)}`;
    const failedUrl = `${BASE_URL}/api/payments/payment-failed?billId=${billId}`;



    console.log("Creating GCash Source in PayMongo:", {
      amount,
      billId,
      tenantEmail,
      successUrl,
      failedUrl
    });    

    // Create GCash source with correct amount
    const paymongoResponse = await axios.post('https://api.paymongo.com/v1/sources', {
      data: {
        attributes: {
          amount, // DO NOT multiply by 100 again (it's already done in handleSend)
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

    console.log("PayMongo Response:", paymongoResponse.data);

    if (!paymongoResponse.data || !paymongoResponse.data.data) {
      return res.status(500).json({ message: "Error creating PayMongo source." });
    }

    res.json({ success: true, checkoutUrl: paymongoResponse.data.data.attributes.redirect.checkout_url });
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

    const status = response.data.data.attributes.status; // Get payment status

    return res.json({ status });
  } catch (error) {
    console.error("Error fetching GCash payment status:", error);
    return res.status(500).json({ message: "Error fetching payment status." });
  }
});

//Not in use, will switch to this with a valid PayMongo Setup.
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

//update payments status
router.post("/update-status", async (req, res) => {
  try {
    const { billId, status } = req.body;

    if (!billId || !status) {
      return res.status(400).json({ message: "billId and status are required." });
    }

    // Find the bill in the database
    const bill = await Files.findByPk(billId);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found." });
    }

    // Update the bill status
    bill.paid = status === "Paid"; // Set paid to true if status is "Paid"
    await bill.save();

    return res.json({ success: true, message: `Bill marked as ${status}.` });
  } catch (error) {
    console.error("Error updating payment status:", error);
    return res.status(500).json({ message: "Error updating payment status." });
  }
});

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