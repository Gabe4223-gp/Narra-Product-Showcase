// routes/workPortalRoutes.js
const express = require('express')
const router = express.Router()
const { Property, WorkPortal } = require('../models')

//Get properties from Properties table.
router.get('/properties', async (req, res) => {
  try {
    const properties = await Property.findAll()

    const results = await Promise.all(
      properties.map(async (prop) => {
        const wp = await WorkPortal.findOne({ where: { propertyId: prop.id } })

        return {
          id: prop.id,
          propertyName: prop.propertyName,
          address: prop.address,
          location: wp?.latitude && wp?.longitude
            ? { lat: wp.latitude, lng: wp.longitude }
            : null
        }
      })
    )

    res.json(results)
  } catch (err) {
    console.error("Error fetching properties:", err)
    res.status(500).json({ error: "Failed to fetch properties" })
  }
})

//Put location in WorkPortal database.
router.post('/update-location', async (req, res) => {
  const { propertyId, lat, lng, fallbackAddress } = req.body;

  try {
    // Check if a location already exists for this property
    const existing = await WorkPortal.findOne({ where: { propertyId } });

    if (existing) {
      // Do not update if it already exists
      return res.status(200).json({ message: 'Location already exists. Skipped saving.' });
    }

    // Create a new entry
    await WorkPortal.create({
      propertyId,
      latitude: lat,
      longitude: lng,
      fallbackAddress,
    });

    res.status(201).json({ message: 'Location saved successfully.' });
  } catch (err) {
    console.error('Error saving location:', err);
    res.status(500).json({ error: 'Failed to save property location.' });
  }
});

//Get contractors from WorkPortal table.
router.get('/contractors/:propertyId', async (req, res) => {
  const { propertyId } = req.params;

  try {
    const portal = await WorkPortal.findOne({ where: { propertyId } });

    if (!portal) {
      return res.status(404).json({ error: 'WorkPortal entry not found.' });
    }

    res.json(portal.contractors || []);
  } catch (err) {
    console.error('Error fetching contractors:', err);
    res.status(500).json({ error: 'Failed to fetch contractors.' });
  }
});

//Add contractors to WorkPortal table.
router.put('/contractors', async (req, res) => {
  const { propertyId, name, role, phone, email } = req.body;

  if (!propertyId || !name || !role || !phone || !email) {
    return res.status(400).json({ error: 'Missing required contractor fields.' });
  }

  try {
    const portal = await WorkPortal.findOne({ where: { propertyId } });
    if (!portal) return res.status(404).json({ error: 'WorkPortal not found.' });

    const newContractor = {
      id: Date.now(), // temp unique ID
      name,
      role,
      phone,
      email,
      description: "",
      status: "",
      price: "",
      availability: "",
      distance: null,
    };

    portal.contractors = [...(portal.contractors || []), newContractor];
    await portal.save();

    res.status(200).json({ success: true, contractor: newContractor });
  } catch (err) {
    console.error('Error saving contractor:', err);
    res.status(500).json({ error: 'Failed to save contractor.' });
  }
});

router.get('/contractors/:propertyId/:contractorId/ratings', async (req, res) => {
  const { propertyId, contractorId } = req.params;
  try {
    const wp = await WorkPortal.findOne({ where: { propertyId } });
    if (!wp || !wp.contractors) return res.json({ ratings: [] });

    const contractor = wp.contractors.find(c => c.id == contractorId);
    if (!contractor || !wp.ratings) return res.json({ ratings: [] });

    const contractorRatings = wp.ratings.filter(r => r.contractorId == contractorId);
    res.json({ ratings: contractorRatings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get ratings' });
  }
});

router.put('/contractors/:propertyId/:contractorId/ratings', async (req, res) => {
  const { propertyId, contractorId } = req.params;
  const { reviewer, comment, stars } = req.body;

  if (!reviewer || !comment || typeof stars !== 'number' || stars < 1 || stars > 5) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    const wp = await WorkPortal.findOne({ where: { propertyId } });
    if (!wp || !wp.contractors || !wp.contractors.find(c => c.id == contractorId)) {
      return res.status(404).json({ error: 'Contractor not found' });
    }

    const newRating = { contractorId, reviewer, comment, stars };
    wp.ratings = [...(wp.ratings || []), newRating];
    await wp.save();

    res.json({ success: true, rating: newRating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;