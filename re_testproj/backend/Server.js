// backend/server.js
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const checkJwt = require('./middleware/authMiddleware');
const protectedRoutes = require('./routes/protectedRoutes');
const { createPaymongoIntent } = require('./paymongoService');
const { createGCashIntent } = require('./paymongoService');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const BaseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200,
  credentials:true,
};
// server.js (Ensure proper error handling and logging)
const morgan = require('morgan');
//const Stripe = require('stripe');


//Authentification
const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', protectedRoutes);
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

// Use morgan for HTTP request logging
app.use(morgan('combined'));

// Initialize Sequelize with PostgreSQL
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: console.log, // Disable logging; enable for debugging
});

// Define the Payment model
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




const Redis = require('ioredis');
const redis = new Redis(); // Defaults to localhost:6379

// Paginated Payments API
app.get('/api/payments', checkJwt, async (req, res) => {
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
const { JwksRateLimitError } = require('jwks-rsa');

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



app.post('/create-payment-intent', checkJwt, async (req, res) => {
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

// Server.js
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

//Endpoint for GCash Payments
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



app.post('/save-payment-history', checkJwt, async (req, res) => {
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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
