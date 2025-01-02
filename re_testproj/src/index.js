import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import reportWebVitals from './reportWebVitals';


//Replace these with Stripe Publishable key
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(stripeKey);

//PayPal client ID from .env
const paypalID = process.env.REACT_APP_PAYPAL_CLIENT_ID;
const paypalOptions = {
  'client-id': paypalID,
  currency: 'PHP', //CHANGE IF NECESSARY
}

//Replace these with Auth0 domain and client ID
const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;

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

reportWebVitals();
