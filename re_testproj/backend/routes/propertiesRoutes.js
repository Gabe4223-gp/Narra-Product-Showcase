// routes/propertiesRoutes.js
const express = require('express');
const router = express.Router();
const { Property } = require('../models'); // Adjust the path as needed

// POST /api/properties
router.post('/', async (req, res) => {
  try {
    const { propertyName, companyName, propertyAddress, owner, image } = req.body;
    if (!propertyName) {
      return res.status(400).json({ message: 'Property Name is required.' });
    }
    
    // Create the new property record. Here we assume that the "Properties" table
    // has a column named "name" (for property name) and other columns as needed.
    const newProperty = await Property.create({
      name: propertyName,
      companyName: companyName || null,
      address: propertyAddress || null,
      owner: owner || null,
      image: image || "https://via.placeholder.com/150",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({ message: 'Property created successfully', property: newProperty });
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
