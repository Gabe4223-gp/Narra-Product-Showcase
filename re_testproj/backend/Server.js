// backend/server.js
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
require('dotenv').config();

//Authentification
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const path = require('path'); //For invoice PDFs

// Sample data structure
const payments = [
    {
      id: '1',
      name: 'Talong',
      amountPaid: 2000, // Amount in cents ($20.00)
      totalAmount: 2000,
      dateOfPayment: '2023-10-01T10:30:00Z',
      subject: 'October Monthly Bill',
      invoiceUrl: 'http://localhost:5000/invoices/invoice1.pdf',
    },
    // Add more payment records as needed
];

// Middleware to check JWT
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${dev-dzsihvgdbhs65j6v.us.auth0.com}/.well-known/jwks.json`, // Already replaced with Auth0 domain
    }),
    audience: 'your-api-audience', // Replace with your API audience
    issuer: `https://${domain}/`,
    algorithms: ['RS256'],
  });

app.use(cors());
app.use(express.json());
app.use('/invoices', express.static(path.join(__dirname, 'invoices')));

// Endpoint to fetch payment history
app.get('/api/payments', (req, res) => {
    // In a real application, you would fetch this data from a database
    res.json(payments);
});

// Apply the middleware to protected routes
app.get('/api/payments', checkJwt, (req, res) => {
    // Fetch payment history for the authenticated user
    // Replace with actual database query based on user ID
    res.json(payments);
  });

app.post('/create-payment-intent', async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
