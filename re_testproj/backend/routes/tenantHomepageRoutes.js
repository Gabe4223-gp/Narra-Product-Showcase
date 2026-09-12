// routes/tenant.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // For file uploads
const { UserProfile, Unit, sequelize } = require('../models'); // Import your models

// --- Mock Data ---
let mockLease = {
  id: 1,
  leaseStart: '01/01/2023',
  leaseEnd: '12/31/2023',
  monthlyRent: 15000.0,
  leaseAgreementUrl: 'http://localhost:5000/files/lease-agreement.pdf',
};

let mockBilling = [
  {
    id: 1,
    paid: false,
    fullAmount: 15000.0,
    dateBilled: '03/01/2023',
    invoiceUrl: 'http://localhost:5000/files/invoice1.pdf',
  },
  {
    id: 2,
    paid: true,
    fullAmount: 15000.0,
    dateBilled: '02/01/2023',
    invoiceUrl: 'http://localhost:5000/files/invoice2.pdf',
  },
];

let mockPaymentMethods = [
  { id: 1, type: 'Debit/Credit', details: 'Visa ending 1234' },
];

let mockRenewLease = {
  proposalUrl: 'http://localhost:5000/files/lease-proposal.pdf',
};

// --- Endpoints ---

// POST /api/tenant/lease/end-request
//
// Was a stub that logged and returned success, so the landlord was never told.
// Now resolves the tenant, finds the property owner, and files a notification
// for them -- the same mechanism the lease upload uses in the other direction.
router.post('/lease/end-request', async (req, res) => {
  const { tenantId, reason } = req.body;

  if (!tenantId) {
    return res.status(400).json({ message: 'Missing tenantId.' });
  }

  try {
    // Match on user_id or on the profile's email: Tenants.user_id is only
    // linked when a tenant completes the Welcome form, so it can be null.
    const [tenant] = await sequelize.query(
      `SELECT t.id, t.name, t.email, t."propertyId"
         FROM "Tenants" t
         LEFT JOIN "userProfile" u ON u.id = :tenantId::UUID
        WHERE t.user_id = :tenantId::UUID
           OR (u.email IS NOT NULL AND lower(t.email) = lower(u.email))
        LIMIT 1`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    );

    if (!tenant) {
      return res.status(404).json({ message: 'We could not find your tenancy record.' });
    }
    if (!tenant.propertyId) {
      return res.status(409).json({ message: 'Your tenancy is not linked to a property yet.' });
    }

    const trimmedReason = (reason || '').trim();
    const message = trimmedReason
      ? `${tenant.name || tenant.email} has requested to end their lease: ${trimmedReason}`
      : `${tenant.name || tenant.email} has requested to end their lease.`;

    const inserted = await sequelize.query(
      `INSERT INTO "Notifications" ("id", "user_id", "message", "type", "is_read", "created_at", "updated_at")
       SELECT gen_random_uuid(), p."user_id", :message, 'lease', false, NOW(), NOW()
         FROM "Properties" p
        WHERE p."id" = :propertyId AND p."user_id" IS NOT NULL
       RETURNING id`,
      {
        replacements: { message, propertyId: tenant.propertyId },
        type: sequelize.QueryTypes.INSERT,
      }
    );

    const notified = Array.isArray(inserted?.[0]) ? inserted[0].length : 0;

    return res.json({
      message: notified
        ? 'Your request has been sent to your landlord.'
        : 'Request recorded, but your property has no owner on file to notify.',
      notified: notified > 0,
    });
  } catch (error) {
    console.error('Error submitting end-of-lease request:', error);
    return res.status(500).json({ message: 'Could not submit your request. Please try again.' });
  }
});

// POST /tenant/billing/pay
router.post('/billing/pay', upload.single('proofFile'), (req, res) => {
  const { billId, paymentMethod, amountPaid } = req.body;
  const file = req.file;
  console.log(
    `Payment received for bill ${billId} with method ${paymentMethod} and amount ${amountPaid}`
  );
  console.log('File:', file);
  // Update billing records in your database and store the file.
  res.json({ message: 'Payment information submitted successfully' });
});

// GET /tenant/:userId/billingDeadline
router.get('/:userId/billingDeadline', async (req, res) => {
  const { userId } = req.params;
  try {
    const userProfile = await UserProfile.findByPk(userId);
    if (!userProfile || !userProfile.units || userProfile.units.length === 0) {
      return res.status(404).json({ message: 'No units found for this user.' });
    }
    // Get the first unit ID from the array
    const firstUnitId = userProfile.units[0];
    const unit = await Unit.findByPk(firstUnitId);
    if (!unit || !unit.billingDeadline) {
      return res.status(404).json({ message: 'No billing deadline found for this unit.' });
    }
    return res.json({ billingDeadline: unit.billingDeadline });
  } catch (error) {
    console.error('Error fetching billing deadline:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
