// backend/server.js
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const bodyParser = require('body-parser');
const express = require('express');
const app = express();

// Error handling
const morgan = require('morgan');

//Routes
const emailMessageRoutes = require('./routes/emailMessageRoutes');
const tenantApplicationRoutes = require('./routes/tenantApplicationRoutes');
const formRoutes = require('./routes/formRoutes');
const docsRoutes = require('./routes/docsRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const propertiesRoutes = require('./routes/propertiesRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const sendBillRoutes = require('./routes/sendBillRoutes');
const leaseProposalRoutes = require('./routes/leaseProposalRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const tenantSettings = require('./routes/tenantSettings');
const TenantHomepage = require('./routes/tenantHomepageRoutes');

//Commenting out authMiddleware for now.
//const authenticateToken = require('./middleware/authMiddleware');
//const { JwksRateLimitError } = require('jwks-rsa');

//Payments
const { createPaymongoIntent } = require('./paymongoService');
const { createGCashIntent } = require('./paymongoService');

//CORS Configuration
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://www.narra-ph.com',
      'http://localhost:5000/',
    ];    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // Allow requests with no origin (like mobile apps or Postman)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true, // Allow cookies and authentication credentials
};


//Connect to AWS
const AWS = require('aws-sdk');
//Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});
//S3 Instance
const s3 = new AWS.S3();
//AWS RDS Configuration
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'your-rds-endpoint.us-east-2.rds.amazonaws.com',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});



//Temporary Data Storage
const Redis = require('ioredis');
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redis = new Redis(redisUrl);
redis.on('connect', () => {
  console.log('Connected to Redis successfully.');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});


// Queuing System
const Bull = require('bull');
// Initialize Bull queue
const invoiceQueue = new Bull('invoice-generation', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

//PDF Generation
const PDFDocument = require('pdfkit');
const fs = require('fs');
//File Uploads
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory
const { File } = require('./models'); // Adjust if your models are in a different path


//Configure with Frontend
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.get('/', (req, res) => {res.send('Backend is running successfully!');});
app.use(express.json({ limit: '50mb' }));
console.log("Limit is", limit);
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api', protectedRoutes);
app.use('/api/emails', emailMessageRoutes);
app.use('/api/applications', tenantApplicationRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/docs', docsRoutes);
app.use('/api/user-profile', userProfileRoutes);
app.use('/files', express.static('public/files'));
app.use('/api/tenant', TenantHomepage);
app.use('/tenant/settings', tenantSettings);
app.use('/api/properties', propertiesRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/sendBill', sendBillRoutes);
app.use('/api/lease-proposal', leaseProposalRoutes);
app.use((err, req, res, next) => {
  console.error("Error occurred:", err);
  res.status(err.status || 500).json({ error: err.message });
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    console.log('Decoded token:', JSON.stringify(jwt.decode(token, {complete: true})));
  }
  next();
});

// Serve static files (invoices) from the 'invoices' directory
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));
app.use('/uploads', express.static('uploads'));







//Sequelize Connection



const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: console.log, // You might want to disable logging in production by setting logging: false.
});

sequelize.authenticate()
  .then(() => console.log('Database connection has been established successfully.'))
  .catch((err) => console.error('Unable to connect to the database:', err));


app.get('/db-test', async (req, res) => {
  try {
      await sequelize.authenticate();
      res.send('Database connection successful!');
  } catch (err) {
      res.status(500).send('Database connection failed: ' + err.message);
  }
});

// Define the Payment model (WILL MOVE TO A MODELS FOLDER)
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Auto-generate UUID
    primaryKey: true,
  },
  external_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  client_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amountPaid: {
    type: DataTypes.INTEGER, // Stored in cents
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.INTEGER, // Stored in cents
    allowNull: false,
  },
  dateOfPayment: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  invoiceUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'Payments',
  indexes: [
    {
      fields: ['client_id'],
    },
    {
      fields: ['dateOfPayment'],
    },
  ],
});

// Sync the model with the database
sequelize.sync()
  .then(() => {
    console.log('Database & tables created!');
  })
  .catch((error) => {
    console.error('Error syncing with the database:', error);
});

//Issue functions///////////////////////////////////////////////////////////////////////////////

//Fetch issues
app.post('/issues/byIds', async (req, res) => {
  const { unitIds } = req.body;

  // Validate input
  if (!Array.isArray(unitIds) || unitIds.length === 0) {
    return res.status(400).json({ error: 'unitIds must be a non-empty array' });
  }

  try {
    // Fetch all units with their issues arrays
    const unitsQuery = `
      SELECT * 
      FROM "Units" 
      WHERE id IN (:unitIds)
    `;

    const units = await sequelize.query(unitsQuery, {
      replacements: { unitIds },
      type: sequelize.QueryTypes.SELECT,
    });

    // Compile all issue IDs from the units' issues arrays
    const allIssueIds = units
      .map(unit => {
        // Parse the issues array if it's stored as a JSON string
        const issues = Array.isArray(unit.issues) ? unit.issues : JSON.parse(unit.issues || '[]');
        return issues;
      })
      .flat() // Flatten the array of arrays into a single array
      .filter((issueId, index, self) => self.indexOf(issueId) === index); // Remove duplicates

    // If no issue IDs are found, return an empty array
    if (allIssueIds.length === 0) {
      return res.status(200).json([]);
    }

    // Fetch all issues corresponding to the compiled issue IDs
    const issuesQuery = `
      SELECT * 
      FROM "Issues" 
      WHERE id IN (:allIssueIds)
    `;

    const issues = await sequelize.query(issuesQuery, {
      replacements: { allIssueIds },
      type: sequelize.QueryTypes.SELECT,
    });

    // Send the fetched issues back to the client
    res.status(200).json(issues);
  } catch (error) {
    console.error('Error fetching units or issues:', error);
    res.status(500).json({ error: 'Failed to fetch units or issues' });
  }
});

//Save issues
app.post('/issues', async (req, res) => {
  const { issue, propertyId } = req.body;

  // Validate input
  if (!issue || !propertyId) {
    return res.status(400).json({ error: 'Issue and propertyId are required' });
  }

  try {

    // Step 1: Insert the issue ID into the relevant unit's issues array
    const unitQuery = `
      UPDATE "Units"
      SET issues = array_append(issues, :issueId)
      WHERE "unitNo" = :unitNo
      AND "propertyId" = :propertyId
      RETURNING *;
    `;

    const [updatedUnit] = await sequelize.query(unitQuery, {
      replacements: {
        issueId: issue.id,
        unitNo: issue.unit,
        propertyId: propertyId,
      },
      type: sequelize.QueryTypes.UPDATE,
    }); 

    // Step 2: Insert the issue into the Issues table
    const issueQuery = `
      INSERT INTO "Issues" (
        id, type, subject, description, unit, resolved, 
        "dateRaised", "dateResolved", documents
      ) VALUES (
        :id, :type, :subject, :description, :unit, :resolved, 
        :dateRaised, :dateResolved, ARRAY[:documents]::TEXT[]
      )
      RETURNING *;
    `;

    const [newIssue] = await sequelize.query(issueQuery, {
      replacements: {
        id: issue.id || DataTypes.UUIDV4, // Auto-generate UUID if not provided
        type: issue.type,
        subject: issue.subject,
        description: issue.description,
        unit: issue.unit,
        resolved: issue.resolved || false, // Default to false if not provided
        dateRaised: issue.dateRaised || new Date(), // Default to current date if not provided
        dateResolved: issue.dateResolved || null, // Default to null if not provided
        documents: issue.documents || [], // Default to empty array if not provided
      },
      type: sequelize.QueryTypes.INSERT,
    });

    // Send success response
    res.status(201).json({
      message: 'Issue created and added to unit successfully',
      issue: newIssue[0], // Return the newly created issue
      updatedUnit: updatedUnit[0], // Return the updated unit
    });
    
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: "Failed creating issue, possible that the unit doesn't exist" });
  }
});

// View Current Doc
app.get('/issues/get-doc', async (req, res) => {
  console.log("Function works");

  const { issueId, fileName } = req.query; // Use `req.query` instead of `req.params`

  if (!issueId || !fileName) {
    return res.status(400).json({ message: "Missing issueId or fileName." });
  }

  console.log("Retrieving document for issue:", issueId);
  console.log("File Name:", fileName);
  console.log("AWS_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName, // Ensure this is the correct path to the file in S3
  };

  try {
    // Get the document from AWS S3
    const data = await s3.getObject(params).promise();
    
    console.log("Document Retrieved Successfully");

    // Detect content type (Optional: Ensure correct file format)
    const contentType = data.ContentType || 'application/octet-stream';

    const base64Content = data.Body.toString('base64');

    // Send the document content as a file
    // Send the document content as JSON
    res.json({
      fileType: contentType,   // MIME type of the file
      fileContent: base64Content,  // Base64 encoded file content
    });

  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ message: 'Error retrieving document.' });
  }
});

//Issue doc upload
app.post('/issues/upload-issue-doc', async (req, res) => {
  console.log("the function works");
  const { fileName, fileType, fileContent, issueId} = req.body; //Adjust based on frontend implementation
  
  console.log("AWS_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(fileContent, 'base64'),
    ContentType: fileType,
  };

  try {
    const data = await s3.upload(params).promise();
    const fileUrl = data.Location;

    console.log("FileUrl", fileUrl)

    // Store document reference in the database
    const updateQuery = `
      UPDATE "Issues"
      SET
        "documents" = array_append("documents", :fileId)
      WHERE id = :issueId
      RETURNING *;
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: { 
        fileId: fileName, 
        issueId: issueId, 
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log(result[0][0].documents);

    res.json({message: "Document uploaded successfully"})

  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ message: 'Error uploading invoice.' });
  }
});

//Resolve issues
app.post('/issues/resolve', async (req, res) => {
  const { issueIds } = req.body;

  // Ensure issueIds is an array
  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one issue' });
  }

  try {
    // Create an array of promises
    const updatePromises = issueIds.map(issueId => {
      const issueQuery = `
        UPDATE "Issues" 
        SET resolved = true, "dateResolved" = NOW()
        WHERE id = :issueId
        RETURNING *;
      `;

      return sequelize.query(issueQuery, { 
        replacements: { issueId }, 
        type: sequelize.QueryTypes.UPDATE 
      });
    });

    // Wait for all updates to complete
    const updatedIssues = await Promise.all(updatePromises);

    res.json({ success: true, updatedIssues });
  } catch (error) {
    console.error('Error updating issues:', error);
    res.status(500).json({ error: 'An error occurred while updating issues' });
  }

});

//Unresolve issues
app.post('/issues/unresolve', async (req, res) => {
  const { issueIds } = req.body;

  // Ensure issueIds is an array
  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    return res.status(400).json({ error: 'Please select at least one issue' });
  }

  try {
    // Create an array of promises
    const updatePromises = issueIds.map(issueId => {
      const issueQuery = `
        UPDATE "Issues" 
        SET resolved = false, "dateResolved" = NULL
        WHERE id = :issueId
        RETURNING *;
      `;

      return sequelize.query(issueQuery, { 
        replacements: { issueId }, 
        type: sequelize.QueryTypes.UPDATE 
      });
    });

    // Wait for all updates to complete
    const updatedIssues = await Promise.all(updatePromises);

    res.json({ success: true, updatedIssues });
  } catch (error) {
    console.error('Error updating issues:', error);
    res.status(500).json({ error: 'An error occurred while updating issues' });
  }

});

//Delete issue
app.delete('/issues/delete', async (req, res) => {
  const { issueId } = req.body; // Assuming issueId is passed in the request body

  try {

    // Step 1: Fetch all units
    const fetchAllUnitsQuery = `SELECT * FROM "Units";`;
    const allUnits = await sequelize.query(fetchAllUnitsQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Step 2: Map through all units and update the ones that contain the issueId
    const updatePromises = allUnits.map(async (unit) => {
      if (unit.issues && unit.issues.includes(issueId)) {
        const updatedIssues = unit.issues.filter((id) => id !== issueId);

        const updateUnitQuery = `
          UPDATE "Units"
          SET issues = ARRAY[:updatedIssues]::uuid[]
          WHERE id = :unitId
        `;

        return sequelize.query(updateUnitQuery, {
          replacements: {
            updatedIssues,
            unitId: unit.id,
          },
          type: sequelize.QueryTypes.UPDATE,
        });
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises.filter(Boolean));

    // Step 3: Delete the issue specified by issueId
    const deleteIssueQuery = `DELETE FROM "Issues" WHERE id = :issueId`;

    await sequelize.query(deleteIssueQuery, {
      replacements: { issueId },
      type: sequelize.QueryTypes.DELETE,
    });

    console.log(`Successfully deleted issue with ID ${issueId}`);

    res.status(200).json({ message: "issue deleted and properties updated successfully." });
  } catch (error) {
    console.error("Error deleting issue and updating properties:", error);
    res.status(500).json({ error: "Failed to delete issue and update properties." });
  }
});

app.delete('/issues/delete-all', async (req, res) => {
  const { issueIds, propertyId } = req.body; // Assuming issueIds is an array

  if (!Array.isArray(issueIds) || issueIds.length === 0) {
    return res.status(400).json({ error: "Invalid issueIds array." });
  }

  try {
    const formattedIssueIds = `{${issueIds.join(',')}}`;

    // Step 1: Fetch all units
    const fetchAllUnitsQuery = `SELECT * FROM "Units";`;
    const allUnits = await sequelize.query(fetchAllUnitsQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Step 2: Map through all units and update the ones that contain any issueId
    const updatePromises = allUnits.map(async (unit) => {
      if (unit.issues && unit.issues.some(id => issueIds.includes(id))) {
        const updatedIssues = unit.issues.filter((id) => !issueIds.includes(id));

        const updateUnitQuery = `
          UPDATE "Units"
          SET issues = ARRAY[:updatedIssues]::uuid[]
          WHERE id = :unitId
        `;

        return sequelize.query(updateUnitQuery, {
          replacements: {
            updatedIssues,
            unitId: unit.id,
          },
          type: sequelize.QueryTypes.UPDATE,
        });
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises.filter(Boolean));

    // Step 3: Delete all issues specified by issueIds
    const deleteIssueQuery = `
      DELETE FROM "Issues"
      WHERE id = ANY(:issueIds::uuid[])
    `;

    await sequelize.query(deleteIssueQuery, {
      replacements: { issueIds: formattedIssueIds },
      type: sequelize.QueryTypes.DELETE,
    });

    // Step 4: Fetch the updated list of issues for each unit
    const fetchUpdatedUnitsQuery = `
      SELECT * FROM "Units" WHERE "propertyId" = :propertyId
    `;
    const updatedUnits = await sequelize.query(fetchUpdatedUnitsQuery, {
      replacements: { propertyId },
      type: sequelize.QueryTypes.SELECT,
    });

    const updatedUnitIds = updatedUnits.map(unit => unit.id);

    res.status(200).json({
      message: "Issues deleted and units updated successfully.",
      updatedUnitIds: updatedUnitIds,  // Return the updated list of unit IDs with their issues
    });

    console.log(`Successfully deleted issues with IDs ${issueIds.join(', ')}`);

  } catch (error) {
    console.error("Error deleting issues and updating units:", error);
    res.status(500).json({ error: "Failed to delete issues and update units." });
  }
});

//Delete selected

//Unit functions////////////////////////////////////////////////////////////////////////////////

//Fetch units//
app.post('/units/byIds', async (req, res) => {
  const { unitIds } = req.body;


  // Validate input
  if (!unitIds || !Array.isArray(unitIds)) {
    return res.status(400).json({ error: 'Invalid unit IDs' });
  }

  try {
    // Use Promise.all to fetch tenants in parallel
    const unitsPromises = unitIds.map(async (id) => {
      const query = `SELECT * FROM "Units" WHERE id = :id`;


      // Execute the query for each ID
      const [unit] = await sequelize.query(query, {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      });


      return unit; // Return the tenant data for each ID
    });


    // Wait for all queries to complete
    const units = await Promise.all(unitsPromises);


    // Send the fetched units back to the client
    res.status(200).json(units);
  } catch (error) {
    console.error('Error fetching units by IDs:', error);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

//Save unit//
app.post('/units', async (req, res) => {

  const { unit, propertyId } = req.body;

  // Validate input
  if (!unit || !propertyId) {
    return res.status(400).json({ error: 'Invalid unit or property ID' });
  }


  try {

    // Fetch tenants whose `unit` matches `unitNo`
    const tenantsQuery = `SELECT id FROM "Tenants" WHERE unit = :unitNo`;
    const tenantResults = await sequelize.query(tenantsQuery, {
      replacements: { unitNo: unit.unitNo },
      type: sequelize.QueryTypes.SELECT,
    });

    const tenantIds = tenantResults.map((tenant) => tenant.id); // Extract IDs
  
    const query = `
      INSERT INTO "Units" (
        id, "unitNo", type, mode, "sizeValue", "sizeUnit", "petsAllowed", tenants,
        "propertyId", "waterLastReading", "waterCurrentReading", 
        "electricityLastReading", "electricityCurrentReading", issues, image
      ) VALUES (
        :id, :unitNo, :type, :mode, :sizeValue, :sizeUnit, :petsAllowed, ARRAY[:tenants]::UUID[],
        :propertyId, :waterLastReading, :waterCurrentReading, 
        :electricityLastReading, :electricityCurrentReading, ARRAY[:issues]::UUID[], :image
      )
      RETURNING id;
    `;

    const [newUnit] = await sequelize.query(query, {
      replacements: {
        id: unit.id,
        unitNo: unit.unitNo,
        type: unit.type,
        mode: unit.mode,
        sizeValue: unit.sizeValue,
        sizeUnit: unit.sizeUnit,
        petsAllowed: unit.petsAllowed,
        tenants: tenantIds || [],  // Empty array if no tenants
        propertyId: propertyId,
        // Pass the JSON objects directly (no need for JSON.stringify or [] notation)
        waterLastReading: unit.waterLastReading && unit.waterLastReading.length > 0 ? JSON.stringify(unit.waterLastReading) : '[]', 
        waterCurrentReading: unit.waterCurrentReading && unit.waterCurrentReading.length > 0 ? JSON.stringify(unit.waterCurrentReading) : '[]', 
        electricityLastReading: unit.electricityLastReading && unit.electricityLastReading.length > 0 ? JSON.stringify(unit.electricityLastReading) : '[]',
        electricityCurrentReading: unit.electricityCurrentReading && unit.electricityCurrentReading.length > 0 ? JSON.stringify(unit.electricityCurrentReading) : '[]',
        issues: unit.issues || [],  // Empty array if no issues
        image: unit.image || 'https://via.placeholder.com/150',  // Default image URL
      },
      type: sequelize.QueryTypes.INSERT,
    });

    // Update the "units" array of the selected property
    const updateQuery = `
      UPDATE "Properties"
      SET units = array_append(units, :unitId)
      WHERE id = :propertyId
      RETURNING *;
    `;
    const [updatedProperty] = await sequelize.query(updateQuery, {
      replacements: {
        unitId: newUnit[0]?.id,
        propertyId,
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log(updatedProperty[0]?.units);

    res.status(201).json({
      message: 'Unit created and added to property successfully',
      unit: newUnit,
      units: updatedProperty[0]?.units,
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ error: 'Failed to create unit' });
  }
});

//Save size units//
app.post('/units/size', async (req, res) => {
  
  const { propertyId, sizeUnits } = req.body;

  // Validate input
  if (!propertyId) {
    return res.status(400).json({ error: 'Invalid unit or property ID' });
  }

  try {

    // Fetch all units with the given propertyId
    const units = await sequelize.query(
      `SELECT * FROM "Units" WHERE "propertyId" = :propertyId;`,
      {
        replacements: { propertyId },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (units.length === 0) {
      return res.status(404).json({ error: 'No units found for the given propertyId' });
    }

    // Function to update sizeUnit for all units in the Units table
    const updateAllUnits = async (units, sizeUnits) => {
      return await Promise.all(
        units.map(async (unit, index) => {
          await sequelize.query(
            `UPDATE "Units" SET "sizeUnit" = :sizeUnit WHERE id = :unitId RETURNING *;`,
            {
              replacements: {
                unitId: unit.id,  // Updating based on unit ID, not propertyId
                sizeUnit: sizeUnits
              },
              type: sequelize.QueryTypes.UPDATE,
            }
          );
          return unit.id;
        })
      );
    };

    // Step 3: Call the function and update the units
    const updatedUnits = await updateAllUnits(units, sizeUnits);

    // Step 4: Send response with updated units
    res.status(200).json({
      message: 'Units updated successfully!',
      units: updatedUnits.flat(), // Flatten in case of nested arrays
      sizeUnits: sizeUnits,
    });
  
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Unexpected server error' });
  }

});

//Import
app.post("/units/import", async (req, res) => {
  try {
    const { units, propertyId } = req.body; // Include `propertyId` from the frontend

    if (!units|| units.length === 0) {
      return res.status(400).json({ error: "No units provided for import." });
    }


    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required for unit import." });
    }

    // Prepare the raw SQL query to insert units
    const insertPromises = units.map(async (unit) => {
      // Fetch tenants whose `unit` matches `unitNo`
      const tenantsQuery = `SELECT id FROM "Tenants" WHERE unit = :unitNo`;
      const tenantResults = await sequelize.query(tenantsQuery, {
        replacements: { unitNo: unit.unitNo },
        type: sequelize.QueryTypes.SELECT,
      });

      const tenantIds = tenantResults.map((tenant) => tenant.id); // Extract IDs

      const query = `
        INSERT INTO "Units"("id", "unitNo", "type", "mode", "sizeValue", "sizeUnit", "petsAllowed", "tenants", "propertyId", "waterLastReading", "waterCurrentReading", "electricityLastReading", "electricityCurrentReading", "issues", "image")
        VALUES (
        :id, :unitNo, :type, :mode, :sizeValue, :sizeUnit, :petsAllowed, ARRAY[:tenants]::UUID[],
        :propertyId, :waterLastReading, :waterCurrentReading, 
        :electricityLastReading, :electricityCurrentReading, ARRAY[:issues]::UUID[], :image)
        RETURNING *;
      `;

      const values = {
        id: unit.id,
        unitNo: unit.unitNo || null,
        type: unit.type || null,
        mode: unit.mode || null,
        sizeValue: unit.sizeValue || null,
        sizeUnit: unit.sizeUnit || null,
        petsAllowed: unit.petsAllowed === 'Yes' || unit.petsAllowed === 'Y' ? true : unit.petsAllowed === 'No' || unit.petsAllowed === 'N' ? false : null,
        tenants: tenantIds,
        propertyId: propertyId,
        // Pass the JSON objects directly (no need for JSON.stringify or [] notation)
        waterLastReading: unit.waterLastReading && unit.waterLastReading.length > 0 ? JSON.stringify(unit.waterLastReading) : '[]', 
        waterCurrentReading: unit.waterCurrentReading && unit.waterCurrentReading.length > 0 ? JSON.stringify(unit.waterCurrentReading) : '[]', 
        electricityLastReading: unit.electricityLastReading && unit.electricityLastReading.length > 0 ? JSON.stringify(unit.electricityLastReading) : '[]',
        electricityCurrentReading: unit.electricityCurrentReading && unit.electricityCurrentReading.length > 0 ? JSON.stringify(unit.electricityCurrentReading) : '[]',
        issues: [],
        image: unit.image || 'https://via.placeholder.com/150',
      };


      // Execute the query using Sequelize's raw query method
      const [result] = await sequelize.query(query, {
        replacements: values,
        type: sequelize.QueryTypes.INSERT,
      });

      console.log("Step 0 import result", result)


      return result; // Return the inserted unit data with the auto-generated ID
    });


    // Wait for all tenants to be inserted
    const createdUnits = await Promise.all(insertPromises);


    // Update the selected property to include the new tenants
    const unitIds = createdUnits.flatMap((unitArray) => unitArray.map((unit) => unit.id));
   
    const updateQuery = `
      UPDATE "Properties"
      SET units = array_cat(units, :unitIds)
      WHERE id = :propertyId
      RETURNING *;
    `;


    if (!unitIds || unitIds.length === 0) {
      throw new Error('No unit IDs provided to update the property.');
    }


    const [updatedProperty] = await sequelize.query(updateQuery, {
      replacements: {
        unitIds: `{${unitIds.join(',')}}`,
        propertyId,
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    res.status(200).json({
      message: "units imported and assigned to property successfully!",
      units: createdUnits,
      unitIds: updatedProperty[0]?.units,
    });
  } catch (error) {
    console.error("Error importing units:", error);
    res.status(500).json({ error: "Failed to import units." });
  }
});

//Fetch unit for unitProfile//
app.get("/units/:id", async (req, res) => {
  try {
    const unitId = req.params.id;

    // Validate unit ID
    if (!unitId) {
      return res.status(400).json({ error: "unit ID is required." });
    }

    // Query the database to find the unit by ID
    const query = `
      SELECT *
      FROM "Units"
      WHERE "id" = :unitId
    `;
    const [ unit ] = await sequelize.query(query, {
      replacements: { unitId },
      type: sequelize.QueryTypes.SELECT,
    });

    // Collect tenants from tenants array, if there are any tenants
    if (unit.tenants && unit.tenants.length > 0) {
      const tenantIdsArray = Array.isArray(unit.tenants) ? unit.tenants : [unit.tenants]; // Ensure it's an array

      const tenantQuery = `
        SELECT * FROM "Tenants" WHERE "id" = ANY(:tenantIds)
      `;

      const tenants = await sequelize.query(tenantQuery, {
        replacements: { tenantIds: `{${tenantIdsArray.join(',')}}` },
        type: sequelize.QueryTypes.SELECT,
      });

      // Check if tenants exist
      if (!tenants || tenants.length < 1) {
        return res.status(404).json({ error: "Unit has no tenants." });
      }

      // Return the unit details along with tenants
      return res.status(200).json({ unit, tenants });

    } else {
      const tenants = [];
      return res.status(404).json({ message: "No tenants associated with this unit.", unit, tenants });
    }

  } catch (error) {
    console.error("Error fetching unit:", error);
    res.status(500).json({ error: "An error occurred while fetching the unit." });
  }
});

//Edit a unit on unitProfile//
app.post('/units/update', async (req, res) => {
  const { unit } = req.body;

  console.log("ooooo", unit);

  try {

    const query = `
      UPDATE "Units"
      SET
        "unitNo" = :unitNo,
        type = :type,
        mode = :mode,
        "sizeValue" = :sizeValue,
        "sizeUnit" = :sizeUnit,
        "petsAllowed" = :petsAllowed,
        "waterLastReading" = :waterLastReading::JSONB,
        "waterCurrentReading" = :waterCurrentReading::JSONB,
        "electricityLastReading" = :electricityLastReading::JSONB,
        "electricityCurrentReading" = :electricityCurrentReading::JSONB
      WHERE id = :id
      RETURNING *;
    `;

    const [updatedunit] = await sequelize.query(query, {
      replacements: {
        id: unit.id,
        unitNo: unit.unitNo || null,
        type: unit.type || null,
        mode: unit.mode || null,
        sizeValue: unit.sizeValue || null,
        sizeUnit: unit.sizeUnit || null,
        petsAllowed: unit.petsAllowed || null,
        waterLastReading: JSON.stringify(unit.waterLastReading || []), // Convert to JSON string
        waterCurrentReading: JSON.stringify(unit.waterCurrentReading || []),
        electricityLastReading: JSON.stringify(unit.electricityLastReading || []),
        electricityCurrentReading: JSON.stringify(unit.electricityCurrentReading || [])
      },
      type: sequelize.QueryTypes.UPDATE,
    });


    if (!updatedunit || updatedunit.length === 0) {
      return res.status(404).json({ error: 'unit not found or no changes made.' });
    }

    res.status(200).json({ message: 'unit updated successfully!', unit: updatedunit[0] });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({ error: 'Failed to update unit.' });
  }
});

//Delete unit
app.delete('/units/delete', async (req, res) => {
  const { unitId } = req.body; // Assuming unitId is passed in the request body

  try {

    // Step 1: Fetch all properties
    const fetchAllPropertiesQuery = `SELECT * FROM "Properties";`;
    const allProperties = await sequelize.query(fetchAllPropertiesQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Step 2: Map through all properties and update the ones that contain the unitId
    const updatePromises = allProperties.map(async (property) => {
      if (property.units && property.units.includes(unitId)) {
        const updatedUnits = property.units.filter((id) => id !== unitId);

        const updatePropertyQuery = `
          UPDATE "Properties"
          SET units = ARRAY[:updatedUnits]::uuid[]
          WHERE id = :propertyId;
        `;

        return sequelize.query(updatePropertyQuery, {
          replacements: {
            updatedUnits,
            propertyId: property.id,
          },
          type: sequelize.QueryTypes.UPDATE,
        });
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises.filter(Boolean));

    // Step 3: Delete all Issues connected to the unit

    const getUnitIssuesQuery = `
      SELECT issues
      FROM "Units"
      WHERE id = :unitId
    `;

    const [unit] = await sequelize.query(getUnitIssuesQuery, {
      replacements: { unitId },
      type: sequelize.QueryTypes.SELECT,
    });

    if (unit && Array.isArray(unit.issues) && unit.issues?.length > 0) {
      const deleteIssueQuery = `
        DELETE FROM "Issues"
        WHERE id = ANY(ARRAY[:issues]::UUID[])
      `;
    
      await sequelize.query(deleteIssueQuery, {
        replacements: { issues: unit.issues }, // Pass the array of issue IDs to delete
        type: sequelize.QueryTypes.DELETE,
      });
    }
    
    // Step 4: Delete the unit specified by unitId
    const deleteunitQuery = `DELETE FROM "Units" WHERE id = :unitId`;

    await sequelize.query(deleteunitQuery, {
      replacements: { unitId },
      type: sequelize.QueryTypes.DELETE,
    });

    console.log(`Successfully deleted unit with ID ${unitId}`);

    res.status(200).json({ message: "unit deleted and properties updated successfully." });
  } catch (error) {
    console.error("Error deleting unit and updating properties:", error);
    res.status(500).json({ error: "Failed to delete unit and update properties." });
  }
});

//Delete selected units
app.delete('/units/delete-all', async (req, res) => {
  const { unitIds, propertyId } = req.body; // Assuming unitIds is an array

  if (!Array.isArray(unitIds) || unitIds.length === 0) {
    return res.status(400).json({ error: "Invalid unitIds array." });
  }

  try {

    const formattedUnitIds = `{${unitIds.join(',')}}`;

    // Step 1: Fetch all properties
    const fetchAllPropertiesQuery = `SELECT * FROM "Properties";`;
    const allProperties = await sequelize.query(fetchAllPropertiesQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Step 2: Map through all properties and update the ones that contain the unitId
    const updatePromises = allProperties.map(async (property) => {
      if (property.units && property.units.some(id => unitIds.includes(id))) {
        const updatedUnits = property.units.filter((id) => !unitIds.includes(id));

        const updatePropertyQuery = `
          UPDATE "Properties"
          SET units = ARRAY[:updatedUnits]::uuid[]
          WHERE id = :propertyId;
        `;

        return sequelize.query(updatePropertyQuery, {
          replacements: {
            updatedUnits,
            propertyId: property.id,
          },
          type: sequelize.QueryTypes.UPDATE,
        });
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises.filter(Boolean));

    // Step 3: Delete all Issues connected to the units
    const getUnitIssuesQuery = `
      SELECT issues
      FROM "Units"
      WHERE id = ANY(:unitIds::uuid[])
    `;

    const units = await sequelize.query(getUnitIssuesQuery, {
      replacements: { unitIds: formattedUnitIds },
      type: sequelize.QueryTypes.SELECT,
    });

    console.log("The units", units);

    for (const unit of units) {
      if (unit && Array.isArray(unit.issues) && unit.issues.length > 0) {

        const formattedIssues = `{${unit.issues.join(",")}}`;

        const deleteIssueQuery = `
          DELETE FROM "Issues"
          WHERE id = ANY(:issues::uuid[])
        `;
        
        await sequelize.query(deleteIssueQuery, {
          replacements: { issues: formattedIssues },
          type: sequelize.QueryTypes.DELETE,
        });
      }
    }

    // Step 4: Delete all units specified in unitIds
    const deleteUnitQuery = `DELETE FROM "Units" WHERE id = ANY(:unitIds::uuid[])`;

    await sequelize.query(deleteUnitQuery, {
      replacements: { unitIds: formattedUnitIds },
      type: sequelize.QueryTypes.DELETE,
    });

    // Step 5: Fetch the updated list of unit IDs for the given propertyId
    const fetchUpdatedUnitsQuery = `
      SELECT units FROM "Properties" WHERE id = :propertyId
    `;
    const [updatedProperty] = await sequelize.query(fetchUpdatedUnitsQuery, {
      replacements: { propertyId },
      type: sequelize.QueryTypes.SELECT,
    });

    const updatedUnitIds = updatedProperty ? updatedProperty.units : [];

    res.status(200).json({
      message: "Units deleted and properties updated successfully.",
      updatedUnitIds: updatedUnitIds,  // Return the new list of unit IDs
    });

    console.log(`Successfully deleted units with IDs ${unitIds.join(', ')}`);

  } catch (error) {
    console.error("Error deleting units and updating properties:", error);
    res.status(500).json({ error: "Failed to delete units and update properties." });
  }
});

//Delete selected


//Property functions////////////////////////////////////////////////////////////////////////////////

//Get all properties
app.get('/properties', async (req, res) => {
  const userId = req.query.user_id;
  try {
    const properties = await sequelize.query(
      'SELECT * FROM "Properties" WHERE "user_id" = :userId', {
      replacements: { userId: userId }, // Bind the user_id to the query
      type: sequelize.QueryTypes.SELECT
    }); 
    res.json(properties); // Send the properties as JSON
  } catch (err) {
    console.error('Error fetching properties:', err);
    res.status(500).json({ error: 'Failed to fetch properties' });
  }
});

//Adding new property
app.post("/properties", async (req, res) => {
  const { id, user_id, companyName, propertyName, address, image, owner, tenants, units } = req.body;


  try {
    // Use Sequelize query to insert the new property into the database
    const [result] = await sequelize.query(
      `
      INSERT INTO "Properties" ("id", "user_id", "companyName", "propertyName", "address", "image", "owner", "tenants", "units", "createdAt", "updatedAt")
      VALUES (:id, :user_id, :companyName, :propertyName, :address, :image, :owner, :tenants, :units, :createdAt, :updatedAt)
      RETURNING *;
      `,
      {
        replacements: {
          id,
          user_id,
          companyName,
          propertyName,
          address,
          image: image || "https://via.placeholder.com/150", // Default image
          owner,
          tenants: tenants && tenants.length > 0 ? `{${tenants.join(",")}}` : "{}",
          units: units && units.length > 0 ? `{${units.join(",")}}` : "{}",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );


    // Respond with the newly created property
    res.status(201).json(result[0]); // `result[0]` contains the inserted row
  } catch (error) {
    console.error("Error creating property:", error.message);
    res.status(500).json({ error: "Failed to create property. Please try again." });
  }
});

//Fetch property//
app.get("/properties/:id", async (req, res) => {
  try {
    const propertyId = req.params.id;


    // Validate ID
    if (!propertyId) {
      return res.status(400).json({ error: "ID is required." });
    }


    // Query the database to find the tenant by ID
    const query = `
      SELECT *
      FROM "Properties"
      WHERE "id" = :propertyId
    `;
    const [property] = await sequelize.query(query, {
      replacements: { propertyId },
      type: sequelize.QueryTypes.SELECT,
    });


    // Safely get the lengths
    const unitCount = property.units.length;
    const tenantCount = property.tenants.length;


    // Check if the tenant exists
    if (!property) {
      return res.status(404).json({ error: "Property not found." });
    }


    res.status(200).json({
      property,
      unitCount,
      tenantCount
    });


  } catch (error) {
    console.error("Error fetching property:", error);
    res.status(500).json({ error: "An error occurred while fetching the property." });
  }
});

//Edit a property//
app.post('/properties/update', async (req, res) => {
  const { property } = req.body;

  try {
    // Update the tenant in the "Tenants" table
    const query = `
      UPDATE "Properties"
      SET
        "companyName" = :companyName,
        "propertyName" = :propertyName,
        address = :address,
        image = :image,
        owner = :owner,
        tenants = :tenants,
        units = :units
      WHERE id = :id
      RETURNING *;
    `;


    const [updatedProperty] = await sequelize.query(query, {
      replacements: {
        id: property.id,
        companyName: property.companyName || null,
        propertyName: property.propertyName || null,
        address: property.address || null,
        image: property.image || null,
        owner: property.owner || null,
        tenants: `{${(property.tenants || []).join(',')}}`, // Format as PostgreSQL array
        units: `{${(property.units || []).join(',')}}`,     // Format as PostgreSQL array
      },
      type: sequelize.QueryTypes.UPDATE,
    });


    // Parse the returned PostgreSQL arrays (if any) into JavaScript arrays
    const units = updatedProperty.units
    ? updatedProperty.units.slice(1, -1).split(',') // Remove '{' and '}' and split
    : [];
    const tenants = updatedProperty.tenants
    ? updatedProperty.tenants.slice(1, -1).split(',') // Remove '{' and '}' and split
    : [];


    // Safely get the lengths
    const unitCount = units.length;
    const tenantCount = tenants.length;


    console.log("here we are", unitCount, tenantCount)


    if (!updatedProperty || updatedProperty.length === 0) {
      return res.status(404).json({ error: 'Property not found or no changes made.' });
    }


    res.status(200).json({ message: 'Property updated successfully!',
      property: updatedProperty,
      unitCount: unitCount,
      tenantCount: tenantCount });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant.' });
  }
});

//Expiring Lease fetch//
app.post("/properties/expiring-leases", async (req, res) => {
  const { tenantIds } = req.body;


  if (!tenantIds || tenantIds.length === 0) {
    return res.status(400).json({ error: "Tenant IDs are required." });
  }


  try {
    // Use Promise.all to fetch tenants in parallel
    const tenantsPromises = tenantIds.map(async (id) => {
      const query = `SELECT * FROM "Tenants" WHERE id = :id AND "leaseExpiry" <= NOW() + INTERVAL '2 months'`;


      // Execute the query for each ID with the condition for lease expiry
      const [tenant] = await sequelize.query(query, {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      });


      return tenant; // Return the tenant data for each ID
    });


    // Wait for all queries to complete
    const tenants = await Promise.all(tenantsPromises);

    // Filter tenants where leaseExpiry is within the next 2 months (if needed)
    const tenantsWithExpiringLeases = tenants.filter(tenant => {
      if (!tenant || !tenant.leaseExpiry) return false;
  
      const leaseExpiryDate = new Date(tenant.leaseExpiry);
      const currentDate = new Date();
      const twoMonthsLater = new Date();
      twoMonthsLater.setMonth(currentDate.getMonth() + 2);
  
      return leaseExpiryDate >= currentDate && leaseExpiryDate <= twoMonthsLater;
    });

    console.log("Tenants with expiring leases:", tenantsWithExpiringLeases);

    res.json({
      tenants: tenantsWithExpiringLeases,
      });

  } catch (error) {
    console.error("Error fetching tenants with expiring leases:", error);
    res.status(500).json({ error: "Failed to fetch expiring leases." });
  }
});

//Delete Property//
app.delete('/properties/delete', async (req, res) => {
  const { propertyId, tenantIds, unitIds } = req.body; // Pass `propertyId` and `tenantIds` in the request body

  console.log("The tenant IDS", tenantIds);

  try {
    // Delete all tenants associated with the property
    const deleteTenantsPromises = tenantIds.map(async (tenantId) => {
        const query = `DELETE FROM "Tenants" WHERE id = :tenantId`;

        // Execute the delete query for each tenant ID
        await sequelize.query(query, {
            replacements: { tenantId },
            type: sequelize.QueryTypes.DELETE,
        });
    });

    // Wait for all tenant deletions to complete
    await Promise.all(deleteTenantsPromises);

    const deleteUnitsPromises = unitIds.map(async (unitId) => {
 
      // Step 1: Retrieve unit and its associated issues
      const selectUnitQuery = `SELECT * FROM "Units" WHERE id = :unitId`;
      const unitResults = await sequelize.query(selectUnitQuery, {
          replacements: { unitId },
          type: sequelize.QueryTypes.SELECT,
      });

      if (unitResults.length === 0) {
          console.log(`Unit with ID ${unitId} not found.`);
          return;
      }

      const unitToDelete = unitResults[0]; // First result
      const issuesToDelete = unitToDelete.issues || [];

      // Step 2: Delete issues associated with the unit
      if (issuesToDelete.length > 0) {
          const deleteIssuesQuery = `DELETE FROM "Issues" WHERE id = ANY(ARRAY[:issues]::UUID[])`;
          await sequelize.query(deleteIssuesQuery, {
              replacements: { issues: issuesToDelete },
              type: sequelize.QueryTypes.DELETE,
          });
      }

      // Step 3: Delete the unit itself
      const deleteUnitQuery = `DELETE FROM "Units" WHERE id = :unitId`;
      await sequelize.query(deleteUnitQuery, {
          replacements: { unitId },
          type: sequelize.QueryTypes.DELETE,
      });

      console.log(`Unit ${unitId} and its issues deleted successfully.`);
   
  });
  
  // Execute all deletion promises
  await Promise.all(deleteUnitsPromises);

    // Wait for all tenant deletions to complete
    await Promise.all(deleteUnitsPromises);

    // Delete the property itself
    const deletePropertyQuery = `DELETE FROM "Properties" WHERE id = :propertyId`;

    await sequelize.query(deletePropertyQuery, {
        replacements: { propertyId },
        type: sequelize.QueryTypes.DELETE,
    });

    console.log(`Successfully deleted property with ID ${propertyId} and its associated tenants.`);
    res.status(200).json({ message: "Property and associated tenants deleted successfully." });
  } catch (error) {
      console.error("Error deleting property and tenants:", error);
      res.status(500).json({ error: "Failed to delete property and tenants." });
  }
});

//Tenant functions////////////////////////////////////////////////////////////////////////////////

//Fetch tenants//
app.post('/tenants/byIds', async (req, res) => {
  const { tenantIds } = req.body;


  // Validate input
  if (!tenantIds || !Array.isArray(tenantIds)) {
    return res.status(400).json({ error: 'Invalid tenant IDs' });
  }


  try {
    // Use Promise.all to fetch tenants in parallel
    const tenantsPromises = tenantIds.map(async (id) => {
      const query = `SELECT * FROM "Tenants" WHERE id = :id`;


      // Execute the query for each ID
      const [tenant] = await sequelize.query(query, {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      });


      return tenant; // Return the tenant data for each ID
    });


    // Wait for all queries to complete
    const tenants = await Promise.all(tenantsPromises);


    // Send the fetched tenants back to the client
    res.status(200).json(tenants);
  } catch (error) {
    console.error('Error fetching tenants by IDs:', error);
    res.status(500).json({ error: 'Failed to fetch tenants' });
  }
});

//Save tenant//
app.post('/tenants', async (req, res) => {
  const { tenant, propertyId, userId } = req.body;

  // Validate input
  if (!tenant || !propertyId) {
    return res.status(400).json({ error: 'Invalid tenant or property ID' });
  }

  try {
    // Format array
    const formattedArray = "{}";

    // Save the new tenant to the "Tenants" table
    const query = `
      INSERT INTO "Tenants" (
        id, name, unit, phone, email, "leaseStarted", "leaseExpiry",
        "leaseDocs", "moveinDate", "moveoutDate", "billingDeadline", nationality,
        occupation, image, "eWalletName", "eWalletReferenceNo", "bankName",
        "bankReferenceNo", "creditCardName", "creditCardNo", "creditCardDate",
        "primaryPaymentMethod", govid, "propertyId"
      ) VALUES (
        :id, :name, :unit, :phone, :email, :leaseStarted, :leaseExpiry,
        :leaseDoc, :moveinDate, :moveoutDate, :billingDeadline, :nationality,
        :occupation, :image, :eWalletName, :eWalletReferenceNo, :bankName,
        :bankReferenceNo, :creditCardName, :creditCardNo, :creditCardDate,
        :primaryPaymentMethod, :govid, :propertyId
      )
      RETURNING id;
    `;
    const [newTenant] = await sequelize.query(query, {
      replacements: {
        ...tenant,
        leaseDoc: formattedArray,
        govid: formattedArray,
        propertyId: propertyId,
      },
      type: sequelize.QueryTypes.INSERT,
    });

    const userQuery = `
      UPDATE "Tenants"
      SET "user_id" = u.id
      FROM "userProfile" u
      WHERE "Tenants"."email" = u."email"
        AND u."email" = :email
    `;

    await sequelize.query(userQuery, {
      replacements: { email: tenant.email }, // Replace 'targetEmail' with the actual email variable
      type: sequelize.QueryTypes.UPDATE,
    });

    //Update the unit if the tenant unit matches the unitNo
    const updateUnitQuery = `
      UPDATE "Units" 
      SET tenants = array_append(tenants, :tenantId)
      WHERE "unitNo" = :unit AND "propertyId" = :propertyId
      RETURNING *;
    `;

    const [updatedUnit] = await sequelize.query(updateUnitQuery, {
      replacements: { tenantId: tenant.id, unit: tenant.unit, propertyId },
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log("Step 0 updated Unit", updatedUnit);


    // Update the "tenants" array of the selected property
    const updateQuery = `
      UPDATE "Properties"
      SET tenants = array_append(tenants, :tenantId)
      WHERE id = :propertyId
      RETURNING *;
    `;
    const [updatedProperty] = await sequelize.query(updateQuery, {
      replacements: {
        tenantId: newTenant[0]?.id,
        propertyId,
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    res.status(201).json({
      message: 'Tenant created and added to property successfully',
      tenant: newTenant,
      tenants: updatedProperty[0]?.tenants,
      unit: updatedUnit[0]?.unitNo,
    });
  } catch (error) {
    console.error('Error creating tenant:', error);
    res.status(500).json({ error: 'Failed to create tenant' });
  }
});

// View Current Lease
app.get('/tenants/get-lease', async (req, res) => {
  console.log("Function works");

  const { tenantId, fileName } = req.query; // Use `req.query` instead of `req.params`

  if (!tenantId || !fileName) {
    return res.status(400).json({ message: "Missing tenantId or fileName." });
  }

  console.log("Retrieving document for tenant:", tenantId);
  console.log("File Name:", fileName);
  console.log("AWS_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName, // Ensure this is the correct path to the file in S3
  };

  try {
    // Get the document from AWS S3
    const data = await s3.getObject(params).promise();
    
    console.log("Document Retrieved Successfully");

    // Detect content type (Optional: Ensure correct file format)
    const contentType = data.ContentType || 'application/octet-stream';

    const base64Content = data.Body.toString('base64');

    // Send the document content as a file
    // Send the document content as JSON
    res.json({
      fileType: contentType,   // MIME type of the file
      fileContent: base64Content,  // Base64 encoded file content
    });

  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ message: 'Error retrieving document.' });
  }
});

// View GovernmentID
app.get('/tenants/get-id', async (req, res) => {
  
  const { tenantId, fileName } = req.query; // Use `req.query` instead of `req.params`

  if (!tenantId || !fileName) {
    return res.status(400).json({ message: "Missing tenantId or fileName." });
  }

  console.log("Retrieving document for tenant:", tenantId);
  console.log("File Name:", fileName);
  console.log("AWS_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName, // Ensure this is the correct path to the file in S3
  };

  try {
    // Get the document from AWS S3
    const data = await s3.getObject(params).promise();
    
    console.log("Document Retrieved Successfully");

    // Detect content type (Optional: Ensure correct file format)
    const contentType = data.ContentType || 'application/octet-stream';

    const base64Content = data.Body.toString('base64');

    // Send the document content as a file
    // Send the document content as JSON
    res.json({
      fileType: contentType,   // MIME type of the file
      fileContent: base64Content,  // Base64 encoded file content
    });

  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ message: 'Error retrieving document.' });
  }
});

//Fetch tenant for TenantProfile//
app.get("/tenants/:id", async (req, res) => {
  try {
    const tenantId = req.params.id;


    // Validate tenant ID
    if (!tenantId) {
      return res.status(400).json({ error: "Tenant ID is required." });
    }


    // Query the database to find the tenant by ID
    const query = `
      SELECT *
      FROM "Tenants"
      WHERE "id" = :tenantId
    `;
    const [tenant] = await sequelize.query(query, {
      replacements: { tenantId },
      type: sequelize.QueryTypes.SELECT,
    });


    // Check if the tenant exists
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found." });
    }


    // Return the tenant details
    res.status(200).json(tenant);


  } catch (error) {
    console.error("Error fetching tenant:", error);
    res.status(500).json({ error: "An error occurred while fetching the tenant." });
  }
});

//Edit a tenant on TenantProfile//
app.post('/tenants/update', async (req, res) => {
  const { tenant, propertyId } = req.body;

  console.log("Here is the tenant", tenant);
  try {

    // Update the tenant in the "Tenants" table
    const query = `
      UPDATE "Tenants"
      SET
        name = :name,
        unit = :unit,
        phone = :phone,
        email = :email,
        "moveinDate" = :moveinDate,
        "moveoutDate" = :moveoutDate,
        "billingDeadline" = :billingDeadline,
        nationality = :nationality,
        occupation = :occupation,
        image = :image,
        "eWalletName" = :eWalletName,
        "eWalletReferenceNo" = :eWalletReferenceNo,
        "bankName" = :bankName,
        "bankReferenceNo" = :bankReferenceNo,
        "creditCardName" = :creditCardName,
        "creditCardNo" = :creditCardNo,
        "creditCardDate" = :creditCardDate,
        "primaryPaymentMethod" = :primaryPaymentMethod
      WHERE id = :id
      RETURNING *;
    `;


    const [updatedTenant] = await sequelize.query(query, {
      replacements: {
        id: tenant.id,
        name: tenant.name || null,
        unit: tenant.unit || null,
        phone: tenant.phone || null,
        email: tenant.email || null,
        moveinDate: tenant.moveinDate || null,
        moveoutDate: tenant.moveoutDate || null,
        billingDeadline: tenant.billingDeadline || null,
        nationality: tenant.nationality || null,
        occupation: tenant.occupation || null,
        image: tenant.image || null,
        eWalletName: tenant.eWalletName || null,
        eWalletReferenceNo: tenant.eWalletReferenceNo || null,
        bankName: tenant.bankName || null,
        bankReferenceNo: tenant.bankReferenceNo || null,
        creditCardName: tenant.creditCardName || null,
        creditCardNo: tenant.creditCardNo || null,
        creditCardDate: tenant.creditCardDate || null,
        primaryPaymentMethod: tenant.primaryPaymentMethod || null,
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    const updateUnitQuery = `
      UPDATE "Units"
      SET tenants = array_remove(tenants, :tenantId)
      WHERE array_position(tenants, :tenantId) IS NOT NULL
      AND "propertyId" = :propertyId;

      UPDATE "Units" 
      SET tenants = array_append(tenants, :tenantId)
      WHERE "unitNo" = :unit 
      AND "propertyId" = :propertyId
      RETURNING *;
    `;

    const [updatedUnit] = await sequelize.query(updateUnitQuery, {
      replacements: { tenantId: tenant.id, unit: tenant.unit, propertyId },
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log("Step 1 updatedunit", updatedUnit);


    if (!updatedTenant || updatedTenant.length === 0) {
      return res.status(404).json({ error: 'Tenant not found or no changes made.' });
    }

    res.status(200).json({ message: 'Tenant updated successfully!', tenant: updatedTenant[0] });
  } catch (error) {
    console.error('Error updating tenant:', error);
    res.status(500).json({ error: 'Failed to update tenant.' });
  }
});

//Import
app.post("/tenants/import", async (req, res) => {
  try {
    const { tenants, propertyId } = req.body; // Include `propertyId` from the frontend


    if (!tenants || tenants.length === 0) {
      return res.status(400).json({ error: "No tenants provided for import." });
    }


    if (!propertyId) {
      return res.status(400).json({ error: "Property ID is required for tenant import." });
    }


    // Prepare the raw SQL query to insert tenants
    const insertPromises = tenants.map(async (tenant) => {
      const query = `
        INSERT INTO "Tenants"("id", "name", "unit", "phone", "email", "leaseStarted", "leaseExpiry", "moveinDate", "moveoutDate", "billingDeadline", "nationality", "occupation", "image", "eWalletName", "eWalletReferenceNo", "bankName", "bankReferenceNo", "creditCardName", "creditCardNo")
        VALUES (:id, :name, :unit, :phone, :email, :leaseStarted, :leaseExpiry, :moveinDate, :moveoutDate, :billingDeadline, :nationality, :occupation, :image, :eWalletName, :eWalletReferenceNo, :bankName, :bankReferenceNo, :creditCardName, :creditCardNo)
        RETURNING *;
      `;


      const values = {
        id: tenant.id,
        name: tenant.name,
        unit: tenant.unit || null, // Ensure unit is set to null if missing
        phone: tenant.phone || null,
        email: tenant.email || null,
        leaseStarted: tenant.leaseStarted || null,
        leaseExpiry: tenant.leaseExpiry || null,
        moveinDate: tenant.moveinDate || null,
        moveoutDate: tenant.moveoutDate || null,
        billingDeadline: tenant.billingDeadline || null,
        nationality: tenant.nationality || null,
        occupation: tenant.occupation || null,
        image: tenant.image || null,
        eWalletName: tenant.eWalletName || null,
        eWalletReferenceNo: tenant.eWalletReferenceNo || null,
        bankName: tenant.bankName || null,
        bankReferenceNo: tenant.bankReferenceNo || null,
        creditCardName: tenant.creditCardName || null,
        creditCardNo: tenant.creditCardNo || null,
      };


      // Execute the query using Sequelize's raw query method
      const [result] = await sequelize.query(query, {
        replacements: values,
        type: sequelize.QueryTypes.INSERT,
      });


      return result; // Return the inserted tenant data with the auto-generated ID
    });


    // Wait for all tenants to be inserted
    const createdTenants = await Promise.all(insertPromises);


    // Update the selected property to include the new tenants
    const tenantIds = createdTenants.flatMap((tenantArray) => tenantArray.map((tenant) => tenant.id));
    console.log(tenantIds);
    const updateQuery = `
      UPDATE "Properties"
      SET tenants = array_cat(tenants, :tenantIds)
      WHERE id = :propertyId
      RETURNING *;
    `;


    if (!tenantIds || tenantIds.length === 0) {
      throw new Error('No tenant IDs provided to update the property.');
    }


    const [updatedProperty] = await sequelize.query(updateQuery, {
      replacements: {
        tenantIds: `{${tenantIds.join(',')}}`,
        propertyId,
      },
      type: sequelize.QueryTypes.UPDATE,
    });


    res.status(200).json({
      message: "Tenants imported and assigned to property successfully!",
      tenants: createdTenants,
      tenantIds: updatedProperty[0]?.tenants,
    });
  } catch (error) {
    console.error("Error importing tenants:", error);
    res.status(500).json({ error: "Failed to import tenants." });
  }
});

/**
 * POST /files/associate-landlord-tenant
 * Request body: { tenantId, landlordUserProfileId }
 * Behavior:
 *  1. Finds the tenant's email from the tenant table (by tenantId).
 *  2. Finds the landlord's email from userProfile (by landlordUserProfileId).
 *  3. Inserts a row into the files table with tenantemail, landlordemail, plus optional filename/url
 */
// POST /files/associate-landlord-tenant
app.post('/files/associate-landlord-tenant', async (req, res) => {
  try {
    const { tenantemail, landlordemail } = req.body;
    if (!tenantemail || !landlordemail) {
      return res.status(400).json({ message: 'Missing tenantemail or landlordemail.' });
    }

    // Create a new row in "files" table
    const newRecord = await File.create({
      tenantemail,
      landlordemail,
      // optionally store a filename, url, etc. if needed
    });

    return res.json({ message: 'Emails associated successfully.', fileRecord: newRecord });
  } catch (error) {
    console.error('Error creating file record:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

//Delete in TenantProfile
app.delete('/tenants/delete', async (req, res) => {
  const { tenantId, propertyId } = req.body; // Assuming tenantId is passed in the request body

  try {

    // Step 2: Fetch all properties
    const fetchAllPropertiesQuery = `SELECT * FROM "Properties";`;
    const allProperties = await sequelize.query(fetchAllPropertiesQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Step 3: Map through all properties and update the ones that contain the tenantId
    const updatePromises = allProperties.map(async (property) => {
      if (property.tenants && property.tenants.includes(tenantId)) {
        const updatedTenants = property.tenants.filter((id) => id !== tenantId);

        const updatePropertyQuery = `
          UPDATE "Properties"
          SET tenants = ARRAY[:updatedTenants]::uuid[]
          WHERE id = :propertyId;
        `;

        return sequelize.query(updatePropertyQuery, {
          replacements: {
            updatedTenants,
            propertyId: property.id,
          },
          type: sequelize.QueryTypes.UPDATE,
        });
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises.filter(Boolean));

    //Step next: remove the tenantID from the Units

    const updateUnitQuery = `
      UPDATE "Units"
      SET tenants = array_remove(tenants, :tenantId)
      WHERE array_position(tenants, :tenantId) IS NOT NULL
      AND "propertyId" = :propertyId
      RETURNING *;
    `;

    const [updatedUnit] = await sequelize.query(updateUnitQuery, {
      replacements: { tenantId: tenantId, propertyId },
      type: sequelize.QueryTypes.UPDATE,
    });

    // Step 1: Delete the tenant specified by tenantId
    const deleteTenantQuery = `DELETE FROM "Tenants" WHERE id = :tenantId`;

    await sequelize.query(deleteTenantQuery, {
      replacements: { tenantId },
      type: sequelize.QueryTypes.DELETE,
    });

    console.log(`Successfully deleted tenant with ID ${tenantId}`);

    res.status(200).json({ message: "Tenant deleted and properties updated successfully." });
  } catch (error) {
    console.error("Error deleting tenant and updating properties:", error);
    res.status(500).json({ error: "Failed to delete tenant and update properties." });
  }
});

//Delete selected
app.delete('/tenants/delete-all', async (req, res) => {
  const { tenantIds, propertyId } = req.body; // Assuming tenantIds is an array

  if (!Array.isArray(tenantIds) || tenantIds.length === 0) {
    return res.status(400).json({ error: "Invalid tenantIds array." });
  }

  try {
    // Step 2: Fetch all properties
    const fetchAllPropertiesQuery = `SELECT * FROM "Properties";`;
    const allProperties = await sequelize.query(fetchAllPropertiesQuery, {
      type: sequelize.QueryTypes.SELECT,
    });

    // Step 3: Map through all properties and update the ones that contain any of the tenantIds
    const updatePromises = allProperties.map(async (property) => {
      if (property.tenants) {
        const updatedTenants = property.tenants.filter((id) => !tenantIds.includes(id));
        if (updatedTenants.length !== property.tenants.length) {
          const updatePropertyQuery = `
            UPDATE "Properties"
            SET tenants = ARRAY[:updatedTenants]::uuid[]
            WHERE id = :propertyId;
          `;

          return sequelize.query(updatePropertyQuery, {
            replacements: {
              updatedTenants,
              propertyId: property.id,
            },
            type: sequelize.QueryTypes.UPDATE,
          });
        }
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises.filter(Boolean));

    const formattedTenantIds = `{${tenantIds.join(',')}}`

    // Step next: remove all tenantIds from the Units
    const updateUnitQuery = `
      UPDATE "Units"
      SET tenants = array_remove(tenants, :tenantId)
      WHERE "propertyId" = :propertyId
      RETURNING *;
    `;

    for (const tenantId of tenantIds) {
      const [updatedUnits] = await sequelize.query(updateUnitQuery, {
        replacements: {
          tenantId,      // Single tenantId for the iteration
          propertyId     // The propertyId you're working with
        },
        type: sequelize.QueryTypes.UPDATE,
      });
    }

    // Step 1: Delete all tenants specified in tenantIds
    const deleteTenantQuery = `DELETE FROM "Tenants" WHERE id = ANY(:tenantIds::uuid[])`;

    await sequelize.query(deleteTenantQuery, {
      replacements: { tenantIds: formattedTenantIds },
      type: sequelize.QueryTypes.DELETE,
    });

    // Step 4: Fetch the updated list of tenant IDs for the given propertyId
    const fetchUpdatedTenantsQuery = `
      SELECT tenants FROM "Properties" WHERE id = :propertyId
    `;
    const [updatedProperty] = await sequelize.query(fetchUpdatedTenantsQuery, {
      replacements: { propertyId },
      type: sequelize.QueryTypes.SELECT,
    });

    const updatedTenantIds = updatedProperty ? updatedProperty.tenants : [];

    res.status(200).json({
      message: "Tenants deleted and properties updated successfully.",
      updatedTenantIds: updatedTenantIds,  // Return the new list of tenant IDs
    });

    console.log(`Successfully deleted tenants with IDs ${tenantIds.join(', ')}`);

  } catch (error) {
    console.error("Error deleting tenants and updating properties:", error);
    res.status(500).json({ error: "Failed to delete tenants and update properties." });
  }
});

//Lease upload
app.post('/tenants/upload-lease', async (req, res) => {
  console.log("the function works");
  const { id, fileName, fileType, url, fileContent, landlordEmail, tenantEmail, tenantId, leaseStartDate, leaseEndDate} = req.body; //Adjust based on frontend implementation
  
  console.log("AWS_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(fileContent, 'base64'),
    ContentType: fileType,
  };

  try {
    const data = await s3.upload(params).promise();
    const fileUrl = data.Location;

    console.log("FileUrl", fileUrl)

    //Store file in Files table
    const fileQuery = `
      INSERT INTO "Files" (id, "fileName", url, "landlordEmail", "tenantEmail")
      VALUES (:id, :fileName, :url, :landlordEmail, :tenantEmail)
      RETURNING *;
    `

    const fileUpload = await sequelize.query(fileQuery, {
      replacements: {
        id: id,                       // UUID passed from frontend
        fileName: fileName,           // UUID as fileName
        url: fileUrl,                 // URL from S3
        landlordEmail: landlordEmail,
        tenantEmail: tenantEmail,
      },
      type: sequelize.QueryTypes.INSERT, // Specify the query type
    });
    
    // Store document reference in the database
    const updateQuery = `
      UPDATE "Tenants"
      SET
        "leaseDocs" = array_append("leaseDocs", :fileId),
        "leaseStarted" = :leaseStartDate,
        "leaseExpiry" = :leaseEndDate
      WHERE id = :tenantId
      RETURNING *;
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: { 
        fileId: fileName, 
        tenantId: tenantId, 
        leaseStartDate: leaseStartDate, 
        leaseEndDate: leaseEndDate,
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log(result[0][0].leaseDocs);

    res.json({message: "Lease uploaded successfully", fileUrl, leaseDocs: result[0][0]?.leaseDocs})

  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ message: 'Error uploading invoice.' });
  }
});

//GovID upload
app.post('/tenants/upload-govid', async (req, res) => {
 
  const { fileName, fileType, fileContent, tenantId} = req.body; //Adjust based on frontend implementation
  
  console.log("AWS_BUCKET_NAME:", process.env.AWS_S3_BUCKET_NAME);

  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(fileContent, 'base64'),
    ContentType: fileType,
  };

  try {
    const data = await s3.upload(params).promise();
    const fileUrl = data.Location;

    console.log("FileUrl", fileUrl)

    // Store document reference in the database
    const updateQuery = `
      UPDATE "Tenants"
      SET
        "govid" = ARRAY[:fileId]::UUID[]
      WHERE id = :tenantId
      RETURNING *;
    `;

    const result = await sequelize.query(updateQuery, {
      replacements: { 
        fileId: fileName, 
        tenantId: tenantId, 
      },
      type: sequelize.QueryTypes.UPDATE,
    });

    console.log(result[0][0].govid);

    res.json({message: "Lease uploaded successfully", fileUrl, govid: result[0][0]?.govid})

  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ message: 'Error uploading invoice.' });
  }
});



//Billings.js AND Tenant.js PAYMENT API ENDPOINTS
// Paginated Payments API (Checking Payment History)
app.get('/api/payments', async (req, res) => {
  console.log('Query Params:', req.query);
  const page = Number.parseInt(req.query.page, 10);
  const limit = Number.parseInt(req.query.limit, 10);

  // Validate page and limit parameters
  if (Number.isNaN(page) || page <= 0) {
    return res.status(400).json({ error: 'Invalid page parameter. Must be a positive integer.' });
  }
  if (Number.isNaN(limit) || limit <= 0) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be a positive integer.' });
  }

  const clientId = req.user?.sub;
  if (!clientId || !/^auth0\|/.test(clientId)) {
    return res.status(401).json({ error: 'Invalid or missing client ID. User not authenticated.' });
  }

  const cacheKey = `payments:${clientId}:page:${page}:limit:${limit}`;

  try {
    // Check Redis cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('Returning cached data.');
      res.set('Cache-Control', 'public, max-age=60');
      return res.json(JSON.parse(cachedData));
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: { client_id: clientId },
      order: [['dateOfPayment', 'DESC']],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });

    if (!rows.length) {
      return res.status(200).json({
        totalEntries: 0,
        totalPages: 0,
        currentPage: page,
        payments: [],
        message: 'No payment history found for the user.',
      });
    }

    const sanitizedRows = rows.map(row => ({
      id: row.id,
      name: row.name,
      amountPaid: row.amountPaid / 100, // Convert cents to currency
      totalAmount: row.totalAmount / 100,
      dateOfPayment: row.dateOfPayment,
      subject: row.subject,
      invoiceUrl: row.invoiceUrl,
    }));

    const response = {
      totalEntries: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      payments: sanitizedRows,
    };

    // Cache response in Redis
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);

    res.set('Cache-Control', 'public, max-age=60');
    res.json(response);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Unable to load payment history.', error: error.message });
  }
});

//Saves Payment History with Billings.js Format to PostgreSQL
app.post('/save-payment-history', async (req, res) => {
  console.log("request body: ", req.body);
  const { client_id, external_id, name, amountPaid, totalAmount, dateOfPayment, subject, invoiceUrl } = req.body;

  try{
    // Validate client_id and other required fields
    if (!client_id || !amountPaid || !totalAmount || !dateOfPayment || !subject || !invoiceUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Received external_id:', external_id);

    //generate external_id if not provided
    const externalIdValue = external_id || `generated_external_id_${new Date().getTime()}`;
    if (!/^[a-zA-Z0-9_\-]+$/.test(externalIdValue)) {
      console.error('Invalid external_id format:', externalIdValue);
      return res.status(400).json({ error: 'Invalid external_id format' });
  }

  console.log('Final external_id to be used:', externalIdValue);

  const newPayment = await Payment.create({
    id: uuidv4(), // Auto-generate UUID for the primary key
    client_id,
    external_id, // Save Stripe paymentIntent.id here
    name,
    amountPaid,
    totalAmount,
    dateOfPayment,
    subject,
    invoiceUrl,
  });

  console.log('Payment saved successfully:', newPayment);
      //Enqueue invoice generation
      invoiceQueue.add({ paymentId: newPayment.id });
      res.status(201).json({ message: 'Payment history saved successfully and invoice enqueued.', payment: newPayment });
  } catch (error) {
      console.error('Error saving payment history:', error);
      res.status(500).json({ message: 'Unable to save payment history.', error: error.message });
  }
});

//Payment API Through Mastercard/Visa
app.post('/create-payment-intent', async (req, res) => {
  console.log('Request Headers: ', req.headers);
  console.log('Decoded JWT payload:', req.auth.payload);
  const { amount } = req.body;
  const client_id = req.auth.payload.sub; // Auth0 user ID
  console.log('Payment Intent Data:', {amount, client_id});

  if (!amount || amount < 5000) { // 5000 centavos = PHP 50
    return res.status(400).json({ message: 'Amount must be at least PHP 50.' });
  }

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'php',
      metadata: { client_id },
    });

    console.log('Stripe Payment Intent:', paymentIntent);
    console.log('Generated client_secret:', paymentIntent.client_secret);
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    if (!res.headersSent) {
    res.status(500).json({ message: 'Unable to create payment intent.' });
    }
  }
});

// Payment API through Bank Transfer
app.post('/api/paymongo/bank-transfer-intent', async (req, res) => {
  const { amount } = req.body;

  // Validate the amount
  if (!amount || amount < 5000) { // 5000 centavos = PHP 50
    return res.status(400).json({ message: 'Amount must be at least PHP 50.' });
  }

  try {
    // Call PayMongo service to create payment intent
    const paymongoResponse = await createPaymongoIntent(amount);

    // Extract reference number or other relevant details from PayMongo response
    const { reference_number, client_key } = paymongoResponse.data.attributes;

    res.status(200).json({
      referenceNumber: reference_number,
      clientSecret: client_key, // Optional, if needed for additional frontend processing
    });
  } catch (error) {
    console.error('Error creating bank transfer intent:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to create bank transfer intent.' });
  }
});

//Payment API through GCash
app.post('/api/paymongo/gcash-intent', async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 5000) {
    return res.status(400).json({ message: 'Amount must be at least PHP 50.' });
  }

  try {
    const paymongoResponse = await createGCashIntent(amount);
    res.status(200).json({
      paymentIntentId: paymongoResponse.data.id,
      clientKey: paymongoResponse.data.attributes.client_key,
    });
  } catch (error) {
    console.error('Error initiating GCash payment:', error.message);
    res.status(500).json({ message: 'Failed to initiate GCash payment.' });
  }
});

//Invoice generator endpoint for Tenant Billing
// Utility function to generate the invoice PDF
const nodemailer = require('nodemailer');
async function generateInvoicePDF(subject, rentalAmount, utilityFees, otherFees, taxRate, totalAmount, deadline) {
  const invoicesDir = path.join(__dirname, 'invoices');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir);
  }

  const invoicePath = path.join(invoicesDir, `${subject}.pdf`);
  const doc = new PDFDocument();
  const writeStream = fs.createWriteStream(invoicePath);

  doc.pipe(writeStream);
  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Subject: ${subject}`);
  doc.text(`Rental Amount: PHP ${rentalAmount}`);
  doc.text(`Deadline: ${deadline}`);
  doc.moveDown();
  doc.text('Utility Fees:');
  utilityFees.forEach((fee) => {
    doc.text(`${fee.name}: PHP ${fee.amount}`);
  });
  doc.moveDown();
  doc.text('Other Fees:');
  otherFees.forEach((fee) => {
    doc.text(`${fee.name}: PHP ${fee.amount}`);
  });
  doc.moveDown();
  doc.text(`Tax Rate (VAT): ${taxRate}%`);
  doc.text(`Total Amount: PHP ${totalAmount}`);
  doc.end();

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  return invoicePath;
}

// Utility function to send an email
async function sendEmail(email, subject, invoicePath) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Narra ${subject}`,
    text: 'Tenant sent you some billing information!',
    attachments: [
      {
        filename: `${subject}.pdf`,
        path: invoicePath,
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

// Invoice generator endpoint for Tenant Billing
app.post('/api/send-bill', async (req, res) => {
  const {
    subject,
    rentalAmount,
    utilityFees,
    otherFees,
    taxRate,
    totalAmount,
    deadline,
    email,
  } = req.body;

  if (!email || !subject || !rentalAmount || !totalAmount) {
    return res
      .status(400)
      .json({ message: 'Email, subject, rental amount, and total amount are required.' });
  }

  try {
    const invoicePath = await generateInvoicePDF(subject, rentalAmount, utilityFees, otherFees, taxRate, totalAmount, deadline);
    await sendEmail(email, subject, invoicePath);

    res.json({ message: `Bill sent successfully to ${email}!` });
  } catch (error) {
    console.error('Error processing request:', error.stack || error.message);
    res.status(500).json({
      message: 'Failed to send bill. Please ensure all fields are correctly filled and try again.',
    });
  }
});










//I DON'T REMEMBER EXACTLY WHAT THESE ARE FOR, BUT THEY ARE IN THE BILLING.JS OR PAYMENT METHOD

// Endpoint to enqueue invoice generation
app.post('/api/generate-invoice', async (req, res) => {
  const { paymentId } = req.body;

  try {
    await invoiceQueue.add({ paymentId });
    res.json({ message: 'Invoice generation started.' });
  } catch (error) {
    console.error('Error enqueuing invoice generation:', error);
    res.status(500).json({ message: 'Unable to generate invoice.' });
  }
});

// Process the queue
invoiceQueue.process(async (job) => {
  const { paymentId } = job.data;

  // Fetch payment details from the database
  const payment = await Payment.findByPk(paymentId);
  if (!payment) {
    throw new Error('Payment not found.');
  }

  // Generate PDF
  console.log(`Generating invoice for payment ID: ${paymentId}`);
  const doc = new PDFDocument();
  const invoicePath = path.join(__dirname, 'invoices', `invoice-${paymentId}.pdf`);
  const writeStream = fs.createWriteStream(invoicePath);
  doc.pipe(writeStream);

  // Add content to PDF
  doc.fontSize(20).text('Invoice', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${payment.name}`);
  doc.text(`Amount Paid: $${(payment.amountPaid / 100).toFixed(2)}`);
  doc.text(`Total Amount: $${(payment.totalAmount / 100).toFixed(2)}`);
  doc.text(`Date of Payment: ${new Date(payment.dateOfPayment).toLocaleDateString()}`);
  doc.text(`Subject: ${payment.subject}`);

  doc.end();

  // Wait for PDF to be written
  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  // Update payment.invoiceUrl
  const invoiceUrl = `http://localhost:5000/invoices/invoice-${paymentId}.pdf`;
  payment.invoiceUrl = invoiceUrl;
  // Optionally upload to AWS S3 and save URL to the database
  //payment.invoiceUrl = 's3://path-to-invoice.pdf'; // Replace with actual logic
  await payment.save();
});

// Handle queue errors
invoiceQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});










const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
