// Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import the CSS file for styling
import { AuthContext } from './AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate authentication (you would replace this with real authentication)
    if (email === 'user@example.com' && password === 'password') {
      login();
      navigate('/homepage');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <body>
        <h1>Tenent</h1>
        <p1>Let's keep it real...estate</p1>
        <p2>haha fak u</p2>
      </body>
      <div class="space"></div>
      <div class="vl"></div>
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        <div className="form-control">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
          />
        </div>
        <div className="form-control">
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password"
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
