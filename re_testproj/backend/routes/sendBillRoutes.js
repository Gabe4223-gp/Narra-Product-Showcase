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
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');

// Import models – note Files is our reintroduced model
const { Tenant, Files, UserProfile } = require('../models');

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
  return new Promise( async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Convert numeric values
    const rentalAmount = Number(data.rentalAmount) || 0;
    const taxRate = Number(data.taxRate) || 0;
    const totalAmount = Number(data.totalAmount) || 0;

    // Calculate Tax Amount
    const taxableAmount =
      rentalAmount +
      (data.utilityFees || []).reduce((sum, fee) => sum + Number(fee.amount), 0) +
      (data.otherFees || []).reduce((sum, fee) => sum + Number(fee.amount), 0);
    const taxAmount = (taxableAmount * taxRate) / 100;

    try {
      // === QUERY DATABASE TO GET PROPERTY DETAILS ===
      const query = 'SELECT * FROM "Properties" WHERE id = :propertyId';
      const [results] = await sequelize.query(query, {
        replacements: { propertyId: data.propertyId },
        type: sequelize.QueryTypes.SELECT,
      });

      const property = results || {};
      const propertyName = property.propertyName || "Unknown Property";
      const propertyAddress = property.address || "No Address Available";
      const companyName = property.companyName || "No Company Name";

      // === PROPERTY DETAILS ===
      doc.fontSize(10).fillColor("#666666").text("PROPERTY DETAILS", 50, 50);
      doc.fillColor("black").text(`Name: ${propertyName}`, 50, 65);
      doc.text(`Address: ${propertyAddress}`, 50, 80);
      doc.text(`Company: ${companyName}`, 50, 95);

      // === RIGHT HEADER DETAILS ===
      const headerX = 400;
      const headerStartY = 50;
      doc.fillColor("#666666").fontSize(10).text("INVOICE", headerX, headerStartY);
      doc.fillColor("black").text(data.pdfId.substring(0, 5), headerX + 80, headerStartY);
      doc.fillColor("#666666").text("DATE", headerX, headerStartY + 15);
      doc.fillColor("black").text(new Date().toLocaleDateString(), headerX + 80, headerStartY + 15);
      doc.fillColor("#666666").text("TERMS", headerX, headerStartY + 30);
      doc.fillColor("black").text("Due on receipt", headerX + 80, headerStartY + 30);
      doc.fillColor("#666666").text("DUE DATE", headerX, headerStartY + 45);
      doc.fillColor("black").text(data.deadline || "N/A", headerX + 80, headerStartY + 45);

      // === MAIN INVOICE HEADER ===
      doc.fontSize(20).fillColor("#0096D6").text("INVOICE", 50, 160);
      let yPosition = 190; // Adjusted for better spacing

      // === TABLE HEADERS ===
      doc.fillColor("white").rect(50, yPosition, 500, 20).fill("#6699CC");
      doc.fillColor("white").fontSize(10).text("DATE", 60, yPosition + 5);
      doc.text("DESCRIPTION", 160, yPosition + 5);
      doc.text("AMOUNT", 450, yPosition + 5);
      doc.fillColor("black");
      yPosition += 25;

      // === RENTAL AMOUNT ===
      doc.fontSize(10).text(data.deadline || "N/A", 60, yPosition);
      doc.text("Rental", 160, yPosition);
      doc.text(`PHP ${rentalAmount.toFixed(2)}`, 450, yPosition);
      yPosition += 20;

      // === UTILITY FEES ===
      if (data.utilityFees?.length) {
        data.utilityFees.forEach((fee) => {
          doc.fontSize(10).text(new Date(fee.date).toLocaleDateString() || "N/A", 60, yPosition);
          doc.text(fee.name, 160, yPosition);
          doc.text(`PHP ${Number(fee.amount).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });
      }

      // === OTHER FEES ===
      if (data.otherFees?.length) {
        data.otherFees.forEach((fee) => {
          doc.fontSize(10).text(new Date(fee.date).toLocaleDateString() || "N/A", 60, yPosition);
          doc.text(fee.name, 160, yPosition);
          doc.text(`PHP ${Number(fee.amount).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        });
      }

      // === TAX SECTION ===
      yPosition += 15;
      doc.fontSize(10).text(`Tax Rate: ${taxRate}%`, 160, yPosition);
      doc.text(`PHP ${taxAmount.toFixed(2)}`, 450, yPosition);
      yPosition += 20;

      // === TOTAL AMOUNT ===
      yPosition += 20;
      doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
      yPosition += 5;
      doc.fontSize(12).text("BALANCE DUE", 60, yPosition);
      doc.text(`PHP ${totalAmount.toFixed(2)}`, 450, yPosition);

      // === FOOTER ===
      yPosition += 40;
      doc.fontSize(8).fillColor("#666666").text("Thank you for your prompt payment.", 50, yPosition);
      yPosition += 12; // Adjust spacing

      if (data.notes) {
        const noteLines = data.notes.split("\n"); // Split text into lines
        noteLines.forEach((line) => {
          doc.text(line, 50, yPosition, { width: 500, align: "left" });
          yPosition += 12; // Maintain line spacing
        });
      }

      // === Place "Powered by Narra. Visit narra-ph.com" at the bottom center of the page ===
      const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;  // Total height of the page excluding margins
      const footerY = pageHeight - 10;  // 20 is a little gap from the very bottom of the page

      // Place footer at the bottom center of the page
      doc.font("Helvetica")
        .fontSize(10)
        .fillColor("#000000")
        .text("Powered by Narra. Visit narra-ph.com", 0, footerY, { align: "center", width: 600 });

      doc.end();
      stream.on("finish", () => resolve(outputPath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}



router.post('/generate', async (req, res) => {
  try {
    const {
      tenantEmail,
      propertyId,
      landlordId,
      landlordEmail,
      subject,
      rentalAmount,
      utilityFees,
      otherFees,
      taxRate,
      deadline,
      totalAmount,
      user_id,
      notes
    } = req.body;

    console.log('Request body:', req.body);

    const pdfId = uuidv4();


    if (!tenantEmail || !subject || !deadline) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    // Fetch landlord's bank ID to store in Files table
    const landlord = await UserProfile.findOne({
      where: { id: landlordId },
      attributes: ['landlordBankId']
    });

    if (!landlord || !landlord.landlordBankId) {
      return res.status(400).json({ message: "Landlord's bank details are missing. Please update settings." });
    }

    // Generate PDF invoice
    const safeSubject = subject.replace(/[^\w\d-]/g, '_');
    const pdfFileName = `${safeSubject}.pdf`;
    const localDir = path.join(__dirname, '..', 'lease_bills');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir);
    const localPDFPath = path.join(localDir, pdfFileName);

    await generatePDF({ pdfId, subject, rentalAmount, utilityFees, otherFees, taxRate, deadline, totalAmount, propertyId, landlordId, notes }, localPDFPath);

    // Store file on local server or AWS S3
    let fileURL;
    if (STORAGE_TYPE === 'local') {
      fileURL = `http://localhost:5000/lease_bills/${encodeURIComponent(pdfFileName)}`;
    } else {
      const fileData = fs.readFileSync(localPDFPath);
      await s3.putObject({
        Bucket: S3_BUCKET_NAME,
        Key: pdfFileName,
        Body: fileData,
        ContentType: 'application/pdf',
      }).promise();
      fs.unlinkSync(localPDFPath);
      fileURL = s3.getSignedUrl('getObject', { Bucket: S3_BUCKET_NAME, Key: pdfFileName, Expires: 3600 });
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
        ("id", "fileName", "fileType", "url", "subject", "totalAmount", "paid", "propertyId", 
        "tenantEmail", "landlordId", "deadline", "updatedAt", "landlordBankId")
      VALUES 
        (:id, :fileName, :fileType, :url, :subject, :totalAmount, :paid, :propertyId, 
        :tenantEmail, :landlordId, :deadline, :updatedAt, :landlordBankId)
      RETURNING *;
      `,
      {
        replacements: {
          id: pdfId,
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
          updatedAt: null, //set to null cuz this attribute will be set when bill is paid
          landlordBankId: landlord.landlordBankId,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    
    console.log("Bill generated. File record:", newFileRecord);
    
    //used currency P
    const notificationQuery = `
      INSERT INTO "Notifications" ("id", "user_id", "message", "type", "created_at")
      SELECT 
        gen_random_uuid(), 
        :user_id,  
        CONCAT(up."name", ' has sent you a bill of P', :totalAmount, ' due ', :deadline), 
        'lease', 
        NOW()
      FROM "userProfile" up
      WHERE up.id = :landlordId  
      RETURNING *;
    `;

    const notifications = await sequelize.query(notificationQuery, {
      replacements: { 
        user_id: user_id, // The user_id to send the notification to
        deadline: deadline,
        totalAmount: totalAmount,
        landlordId: landlordId,
      },
      type: sequelize.QueryTypes.INSERT,
    });

    return res.json({ message: 'Bill generated successfully.', fileRecord: newFile });

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
      where: { tenantEmail, fileType: 'pdf', url: { [Op.ne]: null } }, // Fetch only PDFs with URLs
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'tenantEmail', 'landlordId', 'totalAmount', 'paid', 'fileType',
        'url', 'createdAt', 'subject', 'landlordBankId'
      ]
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

router.get('/get-landlord-payment/:landlordId', async (req, res) => {
  try {
    const landlord = await UserProfile.findOne({
      where: { id: req.params.landlordId },
      attributes: ['landlordBankId', 'bankName']
    });

    if (!landlord) {
      return res.status(404).json({ message: 'Landlord not found' });
    }

    res.json(landlord);
  } catch (error) {
    console.error('Error fetching landlord bank details:', error);
    res.status(500).json({ message: 'Error retrieving landlord bank details' });
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
