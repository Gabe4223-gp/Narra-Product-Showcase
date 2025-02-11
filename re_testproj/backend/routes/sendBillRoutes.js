// routes/sendBillRoutes.js
const express = require('express');
const router = express.Router();
const { Unit } = require('../models'); // Adjust path as needed

// PUT /api/sendBill/update-deadline
router.put('/update-deadline', async (req, res) => {
  console.log("Received request on /api/sendBill/update-deadline:", req.body);
  const { tenantId, deadline } = req.body;
  if (!tenantId || !deadline) {
    return res.status(400).json({ message: "Missing tenantId or deadline." });
  }
  
  try {
    // Use findByPk using tenantId as the primary key (Unit.id)
    const unit = await Unit.findByPk(tenantId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found for this tenantId." });
    }
    
    const parsedDeadline = new Date(deadline);
    if (isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({ message: "Invalid deadline format." });
    }
    
    await unit.update({ billingDeadline: parsedDeadline });
    return res.json({ message: "Billing deadline updated successfully." });
  } catch (error) {
    console.error("Error updating billing deadline:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /api/sendBill/update-total
router.put('/update-total', async (req, res) => {
  const { tenantId, totalAmount } = req.body;
  if (!tenantId || totalAmount == null) {
    return res.status(400).json({ message: "Missing tenantId or totalAmount." });
  }
  
  try {
    // Use findByPk using tenantId as the Unit's id
    const unit = await Unit.findByPk(tenantId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found for this tenantId." });
    }
    
    await unit.update({ total_cost: totalAmount });
    return res.json({ message: "Total cost updated successfully." });
  } catch (error) {
    console.error("Error updating total cost:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
