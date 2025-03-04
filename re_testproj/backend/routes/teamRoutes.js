const express = require('express');
const router = express.Router();
const { Team, Files } = require('../models');

// Fetch all team members
router.get('/', async (req, res) => {
  try {
    console.log('Fetching team members...');
    const teamMembers = await Team.findAll();

    console.log('Team members found:', teamMembers.length);
    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/move-teams/:email', async (req, res) => {
    try {
      const { email } = req.params;
      console.log(`Checking Files table for pending Teams data for: ${email}`);

      // Check if there are any pending Teams data in Files for this email
      const pendingTeamsData = await Files.findOne({ 
        where: { tenantEmail: email } 
      });

      if (!pendingTeamsData || !pendingTeamsData.teamsData) {
        console.log(`No pending Teams data found for ${email}.`);  
        return res.status(200).json({ message: 'No pending Teams data found.' });
      }

      console.log(`Found Teams data for ${email} in Files. Extracting data...`);

      // Extract Teams Data
      const { name, email: userEmail, applications, tenants, units, issues, billings } = pendingTeamsData.teamsData;
      console.log(`Extracted Data:`, {
        name, userEmail, applications, tenants, units, issues, billings
      });

      // Check if user already exists in Teams
      let existingMember = await Team.findOne({ where: { email: userEmail } });

      if (!existingMember) {
        console.log(`Creating new team entry for ${userEmail} in Teams table.`);
        // Step 1: Move Data from Files → Teams Table
        existingMember = await Team.create({
          name,
          email: userEmail,
          applications,
          tenants,
          units,
          issues,
          billings
        });
      } else {
        console.log(`Updating existing team entry for ${userEmail}.`);
        // Step 2: If user already exists, update their permissions
        await existingMember.update({
          applications,
          tenants,
          units,
          issues,
          billings
        });
      }

      // Step 3: Delete the entry from Files table
      console.log(`Deleting processed Teams data for ${email} from Files table.`);
      await pendingTeamsData.destroy();

      console.log(`Teams data successfully transferred for ${email}.`);
      res.status(200).json({ message: 'Teams data successfully transferred.' });
      
    } catch (error) {
      console.error(`Error transferring teams data for ${req.params.email}:`, error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/permissions', async (req, res) => {
    try {
      const { email } = req.query;
  
      if (!email) {
        console.warn(`Missing email parameter in permissions fetch`);
        return res.status(400).json({ error: "Missing email parameter." });
      }
  
      console.log(`Fetching team permissions for ${email}`);
  
      const teamMember = await Team.findOne({ where: { email } });
  
      if (!teamMember) {
        console.log(`No team data found for ${email}`);
        return res.status(404).json({ error: "User not found in Teams." });
      }
  
      console.log(`Found team permissions for ${email}:`, {
        applications: teamMember.applications,
        tenants: teamMember.tenants,
        units: teamMember.units,
        issues: teamMember.issues,
        billings: teamMember.billings
      });
  
      res.json({
        applications: teamMember.applications,
        tenants: teamMember.tenants,
        units: teamMember.units,
        issues: teamMember.issues,
        billings: teamMember.billings
      });
  
    } catch (error) {
      console.error(`Error fetching team permissions: ${error.message}`);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  

// Update an existing team member
router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, applications, tenants, units, issues, billings } = req.body;
  
      console.log(`Received request to update team member: ${email}`);
  
      // Get sender email from headers
      const senderEmail = req.headers['user-email'];
      if (!senderEmail) {
        console.error('Missing user-email in request headers.');
        return res.status(400).json({ error: 'Missing user-email in request.' });
      }
  
      // Step 1: Find the existing team member
      const member = await Team.findByPk(id);
      if (!member) {
        console.log(`Team member with ID ${id} not found.`);
        return res.status(404).json({ error: 'Team member not found' });
      }
  
      // Step 2: Update the `Teams` table
      await member.update({
        name,
        email,
        applications,
        tenants,
        units,
        issues,
        billings
      });
  
      console.log(`Successfully updated team member: ${email}`);
  
      // Step 3: Update `Files` if an entry exists for this email
      const existingFile = await Files.findOne({ where: { tenantEmail: email } });
  
      if (existingFile) {
        await existingFile.update({
          teamsData: {
            name,
            email,
            applications,
            tenants,
            units,
            issues,
            billings
          }
        });
        console.log(`Updated Teams data in Files for ${email}`);
      } else {
        // If no existing file, create a new one
        await Files.create({
          fileName: `Updated Team Data for ${email}`,
          fileType: 'json',
          subject: 'Teams Data Update',
          tenantEmail: email,
          landlordEmail: senderEmail,  // Use sender's email
          teamsData: {
            name,
            email,
            applications,
            tenants,
            units,
            issues,
            billings
          }
        });
        console.log(`Stored updated Teams data in Files for ${email}`);
      }
  
      res.status(200).json(member);
    } catch (error) {
      console.error('Error updating team member:', error.message, error.stack);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});  

// Ensure User Exists in the Team
router.post('/ensure', async (req, res) => {
  try {
    const { name, email } = req.body;

    let user = await Team.findOne({ where: { email } });

    if (!user) {
      user = await Team.create({
        name,
        email,
        applications: true,
        tenants: true,
        units: true,
        issues: true,
        billings: true
      });
      return res.status(201).json(user); // 201 Created
    }

    return res.status(200).json({ message: 'User already exists in the team.' });
  } catch (error) {
    console.error('Error ensuring user exists in team:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
    try {
      const { name, email, applications, tenants, units, issues, billings } = req.body;
  
      console.log(`Received request to add team member: ${email}`);
  
      // Get sender email from headers (frontend should include this)
      const senderEmail = req.headers['user-email']; 
      if (!senderEmail) {
        console.error('Missing user-email in request headers.');
        return res.status(400).json({ error: 'Missing user-email in request.' });
      }
  
      // Check if user is already in Teams
      const existingMember = await Team.findOne({ where: { email } });
      if (existingMember) {
        console.log(`User ${email} already exists in Teams`);
        return res.status(400).json({ error: 'This user is already part of the team.' });
      }
  
      // Step 1: Store in Teams Table
      const newMember = await Team.create({
        name,
        email,
        applications: applications || false,
        tenants: tenants || false,
        units: units || false,
        issues: issues || false,
        billings: billings || false
      });
  
      console.log(`Successfully added team member: ${email}`);
  
      // Step 2: Store in Files Table (for User B to retrieve later)
      await Files.create({
        fileName: `Team Data for ${email}`,
        fileType: 'json',
        subject: 'Teams Data Transfer',
        tenantEmail: email,  // Associates the data with User B
        landlordEmail: senderEmail,  // Use sender's email from headers
        teamsData: {
          name,
          email,
          applications,
          tenants,
          units,
          issues,
          billings
        }
      });
  
      console.log(`Stored teams data in Files for ${email}`);
      res.status(201).json(newMember);
    } catch (error) {
      console.error('Error adding team member:', error.message, error.stack);
      res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});
  

// Delete a team member
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const member = await Team.findByPk(id);
    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    await member.destroy();
    res.status(200).json({ message: 'Team member deleted successfully.' });
  } catch (error) {
    console.error('Error deleting team member:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
