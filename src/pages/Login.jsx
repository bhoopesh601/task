import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/login.css';

/**
 * Login Page - Simple email/password authentication form.
 * Validates inputs, stores user in localStorage, and redirects to Dashboard.
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      login(email);
      setIsLoading(false);
      navigate('/dashboard');
    }, 600);
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    // Clear error on input change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="login-page" id="login-page">
      {/* Animated background */}
      <div className="login-bg" />

      <div className="login-card">
        {/* Theme toggle in card corner */}
        <div className="login-theme-toggle">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="login-header">
          <div className="login-icon">📋</div>
          <h1>Welcome Back</h1>
          <p>Sign in to manage your todos</p>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit} id="login-form">
          {/* Email field */}
          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <div style={{ position: 'relative' }}>
              <span className="input-icon" style={{ top: '50%' }}>📧</span>
              <input
                type="text"
                id="login-email"
                className={`input-field ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoComplete="email"
                style={{ paddingLeft: '44px' }}
              />
            </div>
            {errors.email && <span className="error-text">⚠ {errors.email}</span>}
          </div>

          {/* Password field */}
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div style={{ position: 'relative' }}>
              <span className="input-icon" style={{ top: '50%' }}>🔒</span>
              <input
                type="password"
                id="login-password"
                className={`input-field ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                autoComplete="current-password"
                style={{ paddingLeft: '44px' }}
              />
            </div>
            {errors.password && <span className="error-text">⚠ {errors.password}</span>}
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="login-btn"
            disabled={isLoading}
            id="login-submit-btn"
          >
            {isLoading ? '⏳ Signing in...' : '🚀 Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>Enter any valid email & password (min 6 chars) to continue</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
