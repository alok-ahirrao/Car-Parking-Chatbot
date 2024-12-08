import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './login.css';
const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Toggle between login and registration
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '', // Ensure this key is consistent
    password: '',
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Registration logic
        const { firstName, lastName, email, phoneNumber, password } = formData;
        const response = await axios.post('http://localhost:5000/api/auth/register', {
          firstName, lastName, email, phoneNumber, password,
        });
        console.log('Registration successful:', response.data);
        // Switch to login after successful registration
        setIsSignUp(false);
      } else {
        // Login logic
        if (!emailOrPhone || !password) {
          setError('Please provide both email/phone and password.');
          setLoading(false);
          return;
        }

        const response = await axios.post('http://localhost:5000/api/auth/login', {
          identifier: emailOrPhone,
          password,
        });

        const token = response.data.token;
        console.log('Login successful:', token);

        // Store token in localStorage
        localStorage.setItem('token', token);

        // Redirect to Chatbot
        navigate('/chatbot');
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'An error occurred. Please try again.'); // Show specific error message
    } finally {
      setLoading(false);
    }
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
    setError(''); // Clear error when toggling forms
  };

  return (
    <div id="login-page">   
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-left">
            <h2>{isSignUp ? 'Register' : 'Welcome Back!'}</h2>
            <p>{isSignUp ? 'Create an account to get started.' : 'Let\'s get you logged in.'}</p>
          </div>
          <div className="login-right">
            <form onSubmit={handleSubmit} className="login-form">
              {error && <p className="error-message">{error}</p>}

              {isSignUp && (
                <>
                  <div>
                    <label>First Name:</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Last Name:</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Email:</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label>Phone Number:</label> {/* Changed label to match key */}
                    <input
                      type="tel"
                      value={formData.phoneNumber} // Ensure you use phoneNumber here
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}

              {!isSignUp && (
                <div>
                  <label>Email or Phone:</label>
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label>Password:</label>
                <input
                  type="password"
                  value={isSignUp ? formData.password : password}
                  onChange={(e) =>
                    isSignUp ? setFormData({ ...formData, password: e.target.value }) : setPassword(e.target.value)
                  }
                  required
                />
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (isSignUp ? 'Registering...' : 'Logging in...') : (isSignUp ? 'Register' : 'Login')}
              </button>

              {/* Toggle link below the button */}
              <p className="toggle-form-link" onClick={toggleForm}>
                {isSignUp ? 'Already have an account? Login' : 'Don\'t have an account? Register'}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
