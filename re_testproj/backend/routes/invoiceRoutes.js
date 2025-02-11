// routes/invoicesRoutes.js
const express = require('express');
const router = express.Router();
const { Unit } = require('../models'); // Ensure your Unit model is defined

router.get('/:propertyId', async (req, res) => {
  const propertyId = req.params.propertyId;
  try {
    // Find all units for the given propertyId
    const units = await Unit.findAll({ where: { propertyId } });
    const totalInvoices = units.reduce((sum, unit) => sum + (Number(unit.total_cost) || 0), 0);
    const paidInvoices = units.reduce((sum, unit) => {
      if (unit.paid) {
        return sum + (Number(unit.total_cost) || 0);
      }
      return sum;
    }, 0);
    const outstandingInvoices = totalInvoices - paidInvoices;
    res.json({
      totalInvoices,
      paidInvoices,
      outstandingInvoices,
      lateInvoices: 0, // Placeholder
    });
  } catch (error) {
    console.error("Error computing invoices:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
