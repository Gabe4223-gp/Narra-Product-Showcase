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
