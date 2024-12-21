import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';

//Replace these with Stripe Publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

//PayPal client ID from .env
const paypalOptions = {
  'client-id': process.env.REACT_APP_PAYPAL_CLIENT_ID,
  currency: 'USD',
}

//Replace these with Auth0 domain and client ID
const domain = 'dev-dzsihvgdbhs65j6v.us.auth0.com';
const clientId = 'H4X3e7LJf4jpZrYfLHA5qPCJvCBQpnRe';

ReactDOM.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      redirectUri={window.location.origin}
      cacheLocation='localstorage' // Optional: Persist login state
      useRefreshTokens={true} // Optional: Use refresh tokens
    >
      <Elements stripe={stripePromise}>
        <PayPalScriptProvider options={paypalOptions}>
          <Router>
            <App />
          </Router>
        </PayPalScriptProvider>
      </Elements>
    </Auth0Provider>
  </React.StrictMode>,
  document.getElementById('root')
);