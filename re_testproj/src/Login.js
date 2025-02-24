// Login.js
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Login.css'; // Import the CSS file for styling

function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading, user } = useAuth0();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // If user is already authenticated, direct them to role selection or a homepage
      window.location.href = '/select-role';  // or /homepage, etc.
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        // ensure we request email scope
        scope: 'openid profile email',
      },
    });
  };

  // If you want to remove sign up and forgot password, just comment them out
  /*
  const handleSignup = () => {
    loginWithRedirect({
      screen_hint: 'signup',
      authorizationParams: {
        scope: 'openid profile email',
      },
    });
  };

  const handleForgotPassword = () => {
    // This is not a default Auth0 hint for password reset
    // You might need a custom page, or a rule, or a special URL for this
    loginWithRedirect({
      screen_hint: 'reset_password',
      authorizationParams: {
        scope: 'openid profile email',
      },
    });
  };
  */

  if (isLoading) {
    return <div>Loading...</div>; //Replace with a loading spinner
  }

  return (
    <div className="login-container">
      <h2> narra </h2>

      <button className="btn-login" onClick={handleLogin}>Log In</button>

      {/* 
      If you want to remove these, just comment out or delete:
      <p2>
        Don't have an account? 
        <button className="btn-signup" onClick={handleSignup}>Sign Up</button>
      </p2>
      <p2>
        Forgot Password? 
        <button className="btn-forgot-password" onClick={handleForgotPassword}>
          Forgot Password
        </button>
      </p2>
      */}
    </div>
  );
}

export default Login;

