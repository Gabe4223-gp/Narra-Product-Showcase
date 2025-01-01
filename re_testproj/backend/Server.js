// backend/server.js
require('dotenv').config();
const express = require('express');
const checkJwt = require('./middleware/authMiddleware');
const protectedRoutes = require('./routes/protectedRoutes');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200,
};
// server.js (Ensure proper error handling and logging)
const morgan = require('morgan');
//const Stripe = require('stripe');


//Authentification
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', protectedRoutes);

// Serve static files (invoices) from the 'invoices' directory
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Use morgan for HTTP request logging
app.use(morgan('combined'));

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize('postgres://postgres:***REMOVED***@localhost:5432/narra_payment_history', {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: console.log, // Disable logging; enable for debugging
});

// Define the Payment model
const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true,
  },
  client_id: {
    type: DataTypes.UUID,
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




const Redis = require('ioredis');
const redis = new Redis(); // Defaults to localhost:6379

// Paginated Payments API
app.get('/api/payments', checkJwt, async (req, res) => {
  const { page = 1, limit = 5 } = req.query;
  const clientId = req.user.sub; // Auth0 user ID
  const cacheKey = `payments:${clientId}:page:${page}:limit:${limit}`;

  try {
    //Check if data exists in Redis cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: {
        client_id: clientId, // Adjust based on your auth setup
      },
      order: [['dateOfPayment', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const response = {
      totalEntries: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      payments: rows,
    };

    //Store response in Redis cache for 60 seconds
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 60);

    res.json(response);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Unable to load payment history.' });
  }
});




const AWS = require('aws-sdk');

//Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

//S3 Instance
const s3 = new AWS.S3();

//Endpoint for uploading invoice if necessary
app.post('/api/upload-invoice', checkJwt, async (req, res) => {
  const { fileName, fileType, fileContent} = req.body; //Adjust based on frontend implementation

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileName,
    Body: Buffer.from(fileContent, 'base64'),
    ContentType: fileType,
    ACL: 'public-read',
  };

  try {
    const data = await s3.upload(params).promise();
    res.json({ url: data.Location });
  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ message: 'Error uploading invoice.' });
  }
});

// server.js (Implement Queueing System for Invoice Generation using Bull and Redis)

const Bull = require('bull');

// server.js (Implementing PDF generation for invoices using pdfkit)

const PDFDocument = require('pdfkit');
const fs = require('fs');

// Initialize Bull queue
const invoiceQueue = new Bull('invoice-generation', {
  redis: {
    host: '127.0.0.1',
    port: 6379,
  },
});

// Endpoint to enqueue invoice generation
app.post('/api/generate-invoice', checkJwt, async (req, res) => {
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
  await payment.save();
});

// Handle queue errors
invoiceQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

app.post('/create-payment-intent', checkJwt, async (req, res) => {
  const { amount } = req.body;
  const client_id = req.user.sub; // Auth0 user ID

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'php',
      metadata: { client_id: client_id },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ message: 'Unable to create payment intent.' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
