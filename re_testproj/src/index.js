import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import { BrowserRouter as Router } from 'react-router-dom';

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
      <Router>
        <App />
      </Router>
    </Auth0Provider>
  </React.StrictMode>,
  document.getElementById('root')
);