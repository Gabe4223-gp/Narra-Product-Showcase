const express = require('express');
const { Doc } = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Fetch all documents with pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Doc.findAndCountAll({
      offset: parseInt(offset, 10),
      limit: parseInt(limit, 10),
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ total: count, docs: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch documents.' });
  }
});

// Save a new document
router.post('/', async (req, res) => {
  try {
    const { name, type, content } = req.body;

    // Generate PDF
    const doc = new PDFDocument();
    const fileName = `${name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(16).text(`Document Type: ${type}`, { underline: true });
    doc.text(`Name: ${name}`);
    doc.text('\nContent:');
    doc.text(content);
    doc.end();

    // Save to database
    const newDoc = await Doc.create({
      name,
      type,
      content,
      filePath,
    });

    res.status(201).json({ message: 'Document saved successfully.', doc: newDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save document.' });
  }
});

// Download document PDF
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Doc.findByPk(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (!doc.filePath || !fs.existsSync(doc.filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    res.download(doc.filePath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to download document.' });
  }
});

// Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await Doc.findByPk(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    if (doc.filePath && fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }

    await doc.destroy();
    res.status(200).json({ message: 'Document deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document.' });
  }
});

module.exports = router;
