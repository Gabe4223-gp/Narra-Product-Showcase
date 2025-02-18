// routes/leaseProposalRoutes.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AWS = require('aws-sdk');

// 1) Configure AWS
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION, // e.g. 'ap-southeast-1'
});
const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME; // e.g. 'my-lease-bucket'

// 2) Configure Multer for local file handling
const localUpload = multer({
  dest: 'lease_proposal_uploads/', // local folder
});

// Utility function to build a local file path
function getLocalFilePath(tenantId) {
  // e.g. "lease_proposal_uploads/tenant-1.pdf"
  return path.join(__dirname, '..', 'lease_proposal_uploads', `tenant-${tenantId}.pdf`);
}

// GET /api/lease-proposal/:tenantId/view
router.get('/:tenantId/view', async (req, res) => {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required.' });
      }
  
      const USE_LOCAL = process.env.USE_LOCAL === '1';
  
      if (USE_LOCAL) {
        // Local approach
        const filePath = getLocalFilePath(tenantId);
        if (!fs.existsSync(filePath)) {
          return res.status(404).json({ message: 'No Proposal Found' });
        }
        // Send the file
        return res.sendFile(filePath);
      } else {
        // AWS S3 approach
        const key = `tenant-${tenantId}.pdf`; // or another naming scheme
        // Check if object exists by attempting a headObject
        try {
          await s3.headObject({ Bucket: S3_BUCKET, Key: key }).promise();
        } catch (err) {
          return res.status(404).json({ message: 'No Proposal Found' });
        }
        // If it exists, we can generate a presigned URL or directly stream it
        // Easiest is to create a signed URL:
        const signedUrl = s3.getSignedUrl('getObject', {
          Bucket: S3_BUCKET,
          Key: key,
          Expires: 60, // link valid for 60 seconds
        });
        return res.json({ proposalUrl: signedUrl });
      }
    } catch (error) {
      console.error('Error fetching lease proposal:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });


// We'll do localUpload.single('signedLease') to parse the file from form-data
router.post('/:tenantId/upload', localUpload.single('signedLease'), async (req, res) => {
    try {
      const { tenantId } = req.params;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required.' });
      }
  
      const USE_LOCAL = process.env.USE_LOCAL === '1';
  
      // 1. Delete existing file
      if (USE_LOCAL) {
        const filePath = getLocalFilePath(tenantId);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // remove old file
        }
        // 2. If user uploaded a new PDF, move it to the desired path
        if (!req.file) {
          return res.status(400).json({ message: 'No PDF file uploaded.' });
        }
        fs.renameSync(req.file.path, filePath);
        return res.json({ message: 'Signed lease uploaded (local) successfully.' });
      } else {
        // AWS approach
        const key = `tenant-${tenantId}.pdf`;
        // First delete old file (if it exists)
        try {
          await s3.headObject({ Bucket: S3_BUCKET, Key: key }).promise();
          await s3.deleteObject({ Bucket: S3_BUCKET, Key: key }).promise();
        } catch (err) {
          // if NotFound, ignore
        }
        // Then upload the new one
        if (!req.file) {
          return res.status(400).json({ message: 'No PDF file uploaded.' });
        }
        // read the file from disk
        const fileData = fs.readFileSync(req.file.path);
        // upload to S3
        await s3
          .putObject({
            Bucket: S3_BUCKET,
            Key: key,
            Body: fileData,
            ContentType: 'application/pdf',
          })
          .promise();
        // remove the temp file from local after upload
        fs.unlinkSync(req.file.path);
        return res.json({ message: 'Signed lease uploaded (AWS) successfully.' });
      }
    } catch (error) {
      console.error('Error uploading signed lease:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  module.exports = router;