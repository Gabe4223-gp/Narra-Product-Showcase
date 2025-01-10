const axios = require('axios');
require('dotenv').config();

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY;
const PAYMONGO_API_BASE_URL = 'https://api.paymongo.com/v1';

// Ensure PayMongo secret key is properly loaded
if (!PAYMONGO_SECRET_KEY) {
  throw new Error('PayMongo secret key is not defined in environment variables.');
}

/**
 * Create a Payment Intent using PayMongo API
 * @param {number} amount - The payment amount in centavos (PHP).
 * @returns {Promise<Object>} - The response from PayMongo API.
 */
async function createPaymongoIntent(amount) {
  try {
    // Make API call to PayMongo for creating a payment intent
    const response = await axios.post(
      `${PAYMONGO_API_BASE_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount), // Convert to centavos if not already
            payment_method_allowed: ['bank_transfer'], // Specify payment methods allowed
            currency: 'PHP',
            description: 'Bank Transfer Payment via PayMongo', // Optional description
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`,
        },
      }
    );

    // Return the data from the API response
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent with PayMongo:', error.response?.data || error.message);
    throw error; // Re-throw error for the calling function to handle
  }
}

async function createGCashIntent(amount) {
  try {
    const response = await axios.post(
      `${PAYMONGO_API_BASE_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount),
            payment_method_allowed: ['gcash'],
            currency: 'PHP',
            description: 'GCash Payment via PayMongo',
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(PAYMONGO_SECRET_KEY).toString('base64')}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating GCash payment intent:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createPaymongoIntent,
  createGCashIntent,
};
