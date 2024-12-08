import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Registration.css';

const Registration = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [loading, setLoading] = useState(false); // For loading state
  const [error, setError] = useState(null); // For error messages
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true
    setError(null); // Reset error

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', formData);
      alert(response.data.message); // Show success message
      navigate('/login'); // Navigate to login page after successful registration
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage); // Set the error message
    } finally {
      setLoading(false); // Reset loading state
    }
  };

  return (
    <div id="registration-page">
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-left">
            <h2>Join Us!</h2>
            <p>Create an account to get started.</p>
          </div>
          <div className="login-right">
            <form className="login-form" onSubmit={handleSubmit}>
              <h2>Sign Up</h2>
              {error && <p className="error-message">{error}</p>}
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input-field"
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input-field"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input-field"
              />
              <input
                type="tel"
                name="phoneNumber" // Corrected name to match state
                placeholder="Phone"
                value={formData.phoneNumber} // Updated value to match state
                onChange={handleChange}
                required
                className="input-field"
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input-field"
              />
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
              <p className="create-account-link" onClick={() => navigate('/login')}>
                Already have an account? Login
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
