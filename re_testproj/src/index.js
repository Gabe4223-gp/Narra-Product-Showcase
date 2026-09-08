import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import reportWebVitals from './reportWebVitals';
import 'react-datepicker/dist/react-datepicker.css';


//Replace these with Stripe Publishable key
const stripeKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
const stripePromise = loadStripe(stripeKey);

//PayPal client ID from .env


//Replace these with Auth0 domain and client ID
const domain = process.env.REACT_APP_AUTH0_DOMAIN;
const clientId = process.env.REACT_APP_AUTH0_CLIENT_ID;
const audience = process.env.REACT_APP_AUTH0_AUDIENCE;

// Start waking the API immediately. Free-tier hosting suspends the service
// when idle, and this request overlaps that ~30s wake-up with the Auth0
// redirect the user is already waiting through. Fire-and-forget: failures
// here are irrelevant, the real calls report their own errors.
if (process.env.REACT_APP_API_URL) {
  fetch(`${process.env.REACT_APP_API_URL}/`, { mode: 'cors' }).catch(() => {});
}

ReactDOM.render(
  <React.StrictMode>
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: audience,
        scope: 'openid read:payments write:payments offline_access',
      }}
      cacheLocation='localstorage' // Optional: Persist login state
      useRefreshTokens={true} // Optional: Use refresh tokens
    >
      <Elements stripe={stripePromise}>
        <Router>
          <App />
        </Router>
      </Elements>
    </Auth0Provider>
  </React.StrictMode>,
  document.getElementById('root')
);

reportWebVitals();
