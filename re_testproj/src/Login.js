// Login.js
import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import './Login.css'; // Import the CSS file for styling
import { FaEnvelope } from 'react-icons/fa'; //Optional: For Icons

function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.href = '/homepage';
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = () => {
    loginWithRedirect();
  }

  const handleSignup = () => {
    loginWithRedirect({
      screen_hint: 'signup',
    });
  };

  const handleForgotPassword = () => {
    loginWithRedirect({
      screen_hint: 'reset_password',
    });
  };

  if (isLoading) {
    return <div>Loading...</div>; //Replace with a loading spinner
  }

  return (
    <div className="login-container">
      <h2> Narra </h2>
      <p> Property Made Easy </p>
      <button className="btn-login" onClick={handleLogin}>Log In</button>
      <p2>
        Don't have an account? <button className="btn-signup" onClick={handleSignup}>Sign Up</button>
      </p2>
      <p2>
        Forgot Password? <button className="btn-forgot-password" onClick={handleForgotPassword}><FaEnvelope /> Forgot Password </button>
      </p2>
    </div>
  );
}

export default Login;
