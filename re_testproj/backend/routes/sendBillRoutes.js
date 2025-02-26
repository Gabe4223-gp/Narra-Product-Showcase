// routes/sendBillRoutes.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const AWS = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { sequelize } = require('../models'); 

// Import models – note Files is our reintroduced model
const { Tenant, Files } = require('../models');

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

let s3;
if (STORAGE_TYPE === 's3') {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
}

function generatePDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(20).text(`Bill Subject: ${data.subject}`, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Rental Amount: PHP ${data.rentalAmount}`);
    doc.moveDown();

    doc.text(`Utility Fees:`);
    (data.utilityFees || []).forEach((fee) => {
      doc.text(` - ${fee.name}: PHP ${fee.amount}`);
    });
    doc.moveDown();

    doc.text(`Other Fees:`);
    (data.otherFees || []).forEach((fee) => {
      doc.text(` - ${fee.name}: PHP ${fee.amount}`);
    });
    doc.moveDown();

    doc.text(`Tax Rate: ${data.taxRate}%`);
    doc.moveDown();
    doc.text(`Total Amount: PHP ${data.totalAmount.toFixed(2)}`);
    doc.moveDown();
    doc.text(`Deadline: ${data.deadline}`);

    // IDs are not printed on the PDF

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

router.post('/generate', async (req, res) => {
  try {
    const {
      tenantEmail,
      propertyId,
      landlordId,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      totalAmount,
    } = req.body;

    console.log('Request body:', req.body);


    if (!tenantEmail || !subject || !deadline) {
      return res.status(400).json({ message: 'Missing required fields (tenantEmail, subject, or deadline).' });
    }

    const safeSubject = subject.replace(/[^\w\d-]/g, '_');
    const pdfFileName = `${safeSubject}.pdf`;

    const localDir = path.join(__dirname, '..', 'lease_bills');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir);
    const localPDFPath = path.join(localDir, pdfFileName);

    await generatePDF({ subject, rentalAmount, utilityFees, otherFees, taxRate, deadline, totalAmount }, localPDFPath);

    let fileURL;
    if (STORAGE_TYPE === 'local') {
      fileURL = `http://localhost:5000/lease_bills/${encodeURIComponent(pdfFileName)}`;
    } else {
      const fileData = fs.readFileSync(localPDFPath);
      try {
        await s3.headObject({ Bucket: S3_BUCKET_NAME, Key: pdfFileName }).promise();
        await s3.deleteObject({ Bucket: S3_BUCKET_NAME, Key: pdfFileName }).promise();
      } catch (err) {
        // Ignore if not found
      }
      await s3.putObject({
        Bucket: S3_BUCKET_NAME,
        Key: pdfFileName,
        Body: fileData,
        ContentType: 'application/pdf',
      }).promise();
      fs.unlinkSync(localPDFPath);
      fileURL = s3.getSignedUrl('getObject', {
        Bucket: S3_BUCKET_NAME,
        Key: pdfFileName,
        Expires: 3600,
      });
    }

    // Update the Tenant's billingDeadline based on tenantEmail
    const tenantRecord = await Tenant.findOne({ where: { email: tenantEmail } });
    if (tenantRecord) {
      await tenantRecord.update({ billingDeadline: deadline });
    } else {
      console.log(`Tenant with email ${tenantEmail} not found.`);
    }

    const [newFileRecord] = await sequelize.query(
      `
      INSERT INTO "Files" 
        ("fileName", "fileType", "url", "subject", "totalAmount", "paid", "propertyId", "tenantEmail", "landlordId", "deadline", "updatedAt")
      VALUES 
        (:fileName, :fileType, :url, :subject, :totalAmount, :paid, :propertyId, :tenantEmail, :landlordId, :deadline)
      RETURNING *;
      `,
      {
        replacements: {
          fileName: pdfFileName,
          fileType: 'pdf',
          url: fileURL,
          subject: subject,
          totalAmount: totalAmount,
          paid: false,
          propertyId: propertyId,
          tenantEmail: tenantEmail,
          landlordId: landlordId,
          deadline: deadline,
          updatedAt: null,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    
    console.log("Bill generated. File record:", newFileRecord);

    return res.json({
      message: 'Bill generated successfully.',
      pdfURL: fileURL,
      fileRecord: newFileRecord,
    });
  } catch (error) {
    console.error('Error generating bill:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/tenant/:tenantEmail/files', async (req, res) => {
  try {
    const { tenantEmail } = req.params;
    if (!tenantEmail) {
      return res.status(400).json({ message: 'tenantEmail is required.' });
    }
    const files = await Files.findAll({
      where: { tenantEmail },
      order: [['createdAt', 'DESC']]
    });
    return res.json({ files });
  } catch (error) {
    console.error('Error fetching tenant files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// routes/sendBillRoutes.js (append these endpoints)

// GET unfulfilled bills by propertyId (Raw Sequelize Query)
router.get('/unfulfilled', async (req, res) => {
  try {
    const { propertyId } = req.query;
    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required.' });
    }

    // Raw SQL query to fetch unfulfilled bills by propertyId and paid === false
    const query = `
    SELECT f.*, t."name" AS "tenantName"
    FROM "Files" f
    JOIN "Tenants" t
    ON f."tenantEmail" = t."email"
    WHERE f."propertyId" = :propertyId;
    `;
    
    const files = await sequelize.query(query, {
      replacements: { propertyId },
      type: sequelize.QueryTypes.SELECT
    });
    // Filter the files to only include those where 'paid' is false
    const unfulfilledBills = files.filter(file => file.paid === false);

    console.log("Unfulfilled bills", unfulfilledBills);

    return res.json(unfulfilledBills);
  } catch (error) {
    console.error('Error fetching unfulfilled bills:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// GET fulfilled bills by propertyId
router.get('/fulfilled', async (req, res) => {
  try {
    const { propertyId } = req.query;
    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required.' });
    }
    
    // Raw SQL query to fetch unfulfilled bills by propertyId and paid === false
    const query = `
    SELECT f.*, t."name" AS "tenantName"
    FROM "Files" f
    JOIN "Tenants" t
    ON f."tenantEmail" = t."email"
    WHERE f."propertyId" = :propertyId;
    `;
    
    const files = await sequelize.query(query, {
      replacements: { propertyId },
      type: sequelize.QueryTypes.SELECT
    });
    // Filter the files to only include those where 'paid' is false
    const fulfilledBills = files.filter(file => file.paid === true);

    console.log("Fulfilled bills", fulfilledBills);

    return res.json(fulfilledBills);
  } catch (error) {
    console.error('Error fetching fulfilled bills:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT request to mark selected bills as paid
router.put('/markAsPaid', async (req, res) => {
  const { billIds } = req.body;

  // Check if the billIds are provided and are an array
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty bill IDs array.' });
  }

  try {
    // Raw SQL query to update the 'paid' status of the selected bills
    const query = `
      UPDATE "Files"
      SET "paid" = true,
          "updatedAt" = NOW()
      WHERE "id" IN (:billIds);
    `;

    // Execute the raw query
    const results = await sequelize.query(query, {
      replacements: { billIds },
      type: sequelize.QueryTypes.UPDATE, // You could also use QueryTypes.RAW depending on the operation
    });

    // Check if any rows were affected
    if (results === 0) {
      return res.status(404).json({ message: 'No bills found to update.' });
    }

    // Successfully updated bills
    return res.status(200).json({ message: 'Bills marked as paid successfully.' });
  } catch (error) {
    console.error('Error updating bills:', error);
    return res.status(500).json({ message: 'Failed to mark bills as paid.' });
  }
});

// PUT request to mark selected bills as unpaid
router.put('/markAsUnpaid', async (req, res) => {
  const { billIds } = req.body;

  // Check if the billIds are provided and are an array
  if (!billIds || !Array.isArray(billIds) || billIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty bill IDs array.' });
  }

  try {
    // Raw SQL query to update the 'paid' status of the selected bills
    const query = `
      UPDATE "Files"
      SET "paid" = false
      WHERE "id" IN (:billIds);
    `;

    // Execute the raw query
    const results = await sequelize.query(query, {
      replacements: { billIds },
      type: sequelize.QueryTypes.UPDATE, // You could also use QueryTypes.RAW depending on the operation
    });

    // Check if any rows were affected
    if (results === 0) {
      return res.status(404).json({ message: 'No bills found to update.' });
    }

    // Successfully updated bills
    return res.status(200).json({ message: 'Bills marked as unpaid successfully.' });
  } catch (error) {
    console.error('Error updating bills:', error);
    return res.status(500).json({ message: 'Failed to mark bills as unpaid.' });
  }
});

// DELETE route to delete selected bills
router.delete('/delete-all', async (req, res) => {
  const { bills, propertyId } = req.body;

  console.log("lasdfh", bills)

  // Validate input
  if (!bills || !Array.isArray(bills) || bills.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty bills array.' });
  }
  if (!propertyId) {
    return res.status(400).json({ message: 'Property ID is required.' });
  }

  try {
    // Raw SQL query to delete the selected bills associated with the given property
    const query = `
      DELETE FROM "Files"
      WHERE "id" IN (:bills) AND "propertyId" = :propertyId;
    `;

    const [affectedRows] = await sequelize.query(query, {
      replacements: { bills, propertyId },
      type: sequelize.QueryTypes.DELETE,
    });

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'No matching bills found for deletion.' });
    }

    return res.status(200).json({ message: 'Selected bills deleted successfully.' });
  } catch (error) {
    console.error('Error deleting bills:', error);
    return res.status(500).json({ message: 'Failed to delete selected bills.' });
  }
});



module.exports = router;
