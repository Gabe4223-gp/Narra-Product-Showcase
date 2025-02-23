// routes/sendBillRoutes.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const AWS = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    // Create a record in Files table
    const newFileRecord = await Files.create({
      filename: pdfFileName,
      fileType: 'pdf',
      url: fileURL,
      subject,
      totalAmount,
      paid: false,
      propertyId,
      tenantEmail,
      landlordId,
    });

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

// GET unfulfilled bills by propertyId
router.get('/unfulfilled', async (req, res) => {
  try {
    const { propertyId } = req.query;
    if (!propertyId) {
      return res.status(400).json({ message: 'propertyId is required.' });
    }
    // Filter files by propertyId and unpaid status (paid === false)
    const files = await Files.findAll({
      where: { propertyId, paid: false },
      order: [['createdAt', 'DESC']]
    });
    return res.json(files);
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
    // Filter files by propertyId and paid status (paid === true)
    const files = await Files.findAll({
      where: { propertyId, paid: true },
      order: [['createdAt', 'DESC']]
    });
    return res.json(files);
  } catch (error) {
    console.error('Error fetching fulfilled bills:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


module.exports = router;
