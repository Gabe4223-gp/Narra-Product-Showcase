// routes/sendBillRoutes.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const AWS = require('aws-sdk');

// Import models
const { Tenant, Unit, UserProfile, File } = require('../models');

// Determine storage type from env variable
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
let s3;
if (STORAGE_TYPE === 's3') {
  s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
}
const S3_BUCKET = process.env.AWS_S3_BUCKET;

// Helper function: Generate PDF using pdfkit
function generatePDF(data, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(20).text(`Subject: ${data.subject}`, { underline: true });
    doc.moveDown();
    doc.fontSize(14).text(`Rental Amount: PHP ${data.rentalAmount}`);
    doc.moveDown();
    doc.text(`Utility Fees:`);
    data.utilityFees.forEach((fee) => {
      doc.text(` - ${fee.name}: PHP ${fee.amount}`);
    });
    doc.moveDown();
    doc.text(`Other Fees:`);
    data.otherFees.forEach((fee) => {
      doc.text(` - ${fee.name}: PHP ${fee.amount}`);
    });
    doc.moveDown();
    doc.text(`Tax Rate: ${data.taxRate}%`);
    doc.moveDown();
    doc.text(`Total Amount: PHP ${data.totalAmount.toFixed(2)}`);
    doc.moveDown();
    doc.text(`Deadline: ${data.deadline}`);
    doc.moveDown();
    doc.text(`Send To: ${data.email}`);
    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

// POST /api/sendBill/generate
router.post('/generate', async (req, res) => {
  console.log("Incoming /generate request body:", req.body);
  try {
    const {
      tenantemail,
      landlordemail,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      email,
      totalAmount,
    } = req.body;
    
    // Then rename them or just use them directly
    if (!tenantemail || !landlordemail || !subject || !deadline || !email || !totalAmount) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Generate a PDF file named "<Subject>.pdf"
    const pdfFileName = `${subject}.pdf`;
    const localDir = path.join(__dirname, '..', 'lease_bills');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir);
    const localPDFPath = path.join(localDir, pdfFileName);

    // Generate the PDF file based on input data
    await generatePDF({ subject, rentalAmount, utilityFees, otherFees, taxRate, deadline, email, totalAmount }, localPDFPath);

    let fileURL;
    if (STORAGE_TYPE === 'local') {
      fileURL = `http://localhost:5000/lease_bills/${encodeURIComponent(pdfFileName)}`;
    } else {
      const fileData = fs.readFileSync(localPDFPath);
      const key = pdfFileName;
      try {
        await s3.headObject({ Bucket: S3_BUCKET, Key: key }).promise();
        await s3.deleteObject({ Bucket: S3_BUCKET, Key: key }).promise();
      } catch (err) {
        // File not found in S3, ignore error
      }
      await s3.putObject({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileData,
        ContentType: 'application/pdf',
      }).promise();
      fs.unlinkSync(localPDFPath);
      fileURL = s3.getSignedUrl('getObject', {
        Bucket: S3_BUCKET,
        Key: key,
        Expires: 3600,
      });
    }

    // Update Tenant: set billingDeadline and email
    const tenant = await Tenant.findOne({ where: { email: tenantemail } });
    if (tenant) {
      await tenant.update({ billingDeadline: deadline, email });
    } else {
      console.log(`Tenant with email ${tenantemail} not found.`);
    }

    // Update Unit: update cost with totalAmount. Here we assume a unit has a tenantId that matches tenant.id.
    if (tenant) {
      const unit = await Unit.findOne({ where: { tenantId: tenant.id } });
      if (unit) {
        await unit.update({ cost: totalAmount });
      } else {
        console.log(`No unit found for tenant with email ${tenantemail}`);
      }
    }

    // Create a record in Files table.
    // Note: ensure column names match your model (e.g., landlordemail, tenantemail)
    const newFile = await File.create({
      filename: pdfFileName,
      fileType: 'pdf',
      url: fileURL,
      landlordemail: landlordemail, // using lowercase to match DB column
      tenantemail: tenantemail,
    });

    return res.json({ message: 'Bill generated successfully.', pdfURL: fileURL });
  } catch (error) {
    console.error('Error generating bill:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2️⃣ Retrieve Tenant PDFs (GET /tenant/:tenantemail/files)
router.get('/tenant/:tenantemail/files', async (req, res) => {
  try {
    const { tenantemail } = req.params;
    if (!tenantemail) {
      return res.status(400).json({ message: 'tenantemail is required.' });
    }
    const { File } = require('../models');
    const files = await File.findAll({ where: { tenantemail } });
    return res.json({ files });
  } catch (error) {
    console.error('Error fetching tenant files:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
