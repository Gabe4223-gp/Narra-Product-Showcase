require('dotenv').config();

// For Local and Production switching
const BASE_URL = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_API_URL_PROD
  : process.env.REACT_APP_API_URL;

module.exports = { BASE_URL };