// routes/tenant.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // For file uploads
const { UserProfile, Unit } = require('../models'); // Import your models

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

// POST /tenant/lease/end-request
router.post('/lease/end-request', (req, res) => {
  const { tenantId, leaseId } = req.body;
  // Update the database accordingly.
  console.log(`End lease request for tenant ${tenantId}, lease ${leaseId}`);
  res.json({ message: 'End lease request submitted successfully' });
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
