// routes/invoicesRoutes.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../models'); 

router.get('/:propertyId', async (req, res) => {
  const { propertyId } = req.params;

  try {
      if (!propertyId) {
        return res.status(400).json({ message: 'propertyId is required.' });
      }
  
      // Raw SQL query to fetch bills by propertyId and paid === false
      const query = `
      SELECT * FROM "Files" 
      WHERE "propertyId" = :propertyId;
      `;

      const files = await sequelize.query(query, {
        replacements: { propertyId },
        type: sequelize.QueryTypes.SELECT
      });
  
      console.log("Invoices", files);
  
      return res.json(files);
    } catch (error) {
      console.error('Error fetching invoices bills:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
