const express = require('express');
const { Form } = require('../models');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware'); // OAuth middleware
const multer = require('multer');
const fs = require('fs');
//const { verifyToken, validateDoc } = require('../middleware/auth');
const path = require('path');
const PDFDocument = require('pdfkit');

// Middleware to protect all routes
router.use(authenticateToken);

// Multer setup for file uploads
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Only .jpeg, .jpg, and .png files are allowed.'));
    }
  },
});

// Save a new form
router.post(
  '/',
  upload.fields([{ name: 'photo' }, { name: 'governmentId' }]),
  async (req, res) => {
    try {
      const { name, type, personalDetails, billingDetails, content } = req.body;

      const photo = req.files?.photo?.[0];
      const governmentId = req.files?.governmentId?.[0];

      // Generate PDF
      const doc = new PDFDocument();
      const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../uploads', fileName);

      doc.pipe(fs.createWriteStream(filePath));
      doc.fontSize(16).text(`Form Type: ${type}`, { underline: true });
      doc.text(`Name: ${name}`);

      if (type === 'Tenant Application') {
        doc.text('\nPersonal Details:');
        Object.entries(JSON.parse(personalDetails)).forEach(([key, value]) =>
          doc.text(`${key}: ${value}`)
        );

        doc.text('\nBilling Details:');
        Object.entries(JSON.parse(billingDetails)).forEach(([key, value]) =>
          doc.text(`${key}: ${value}`)
        );
      } else if (type === 'Complaint') {
        doc.text('\nComplaint:');
        doc.text(content);
      }

      if (photo) doc.text(`\nPhoto Uploaded: ${photo.filename}`);
      if (governmentId) doc.text(`Government ID Uploaded: ${governmentId.filename}`);
      doc.end();

      // Save to database
      const form = await Form.create({
        name,
        type,
        content,
        filePath,
      });

      res.status(201).json({ message: 'Form saved successfully', form });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to save form' });
    }
  }
);

// Fetch all forms (real + mock)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Form.findAndCountAll({
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ total: count + mockData.length, forms: combinedData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// View or download PDF
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findByPk(id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (!form.filePath || !fs.existsSync(form.filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(form.filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download form' });
  }
});

// Delete form
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const form = await Form.findByPk(id);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    if (form.filePath && fs.existsSync(form.filePath)) {
      fs.unlinkSync(form.filePath);
    }

    await form.destroy();
    res.status(200).json({ message: 'Form deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});
