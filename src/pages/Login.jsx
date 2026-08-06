import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { isValidEmail } from '../utils/helpers';
import '../styles/login.css';

const REGISTERED_USERS_KEY = 'registeredUsers';

const getRegisteredUsers = () => {
  try {
    const stored = window.localStorage.getItem(REGISTERED_USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRegisteredUser = (user) => {
  const users = getRegisteredUsers();
  window.localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, user]));
};

/**
 * Login Page — Clean pre-authentication portal.
 * Todoist-inspired split layout with toggleable Log in / Sign up modes.
 */
const Login = () => {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { theme } = useTheme();
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isSignUp = mode === 'signup';

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'name') setName(value);
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    clearFieldError(field);
  };

  const validateLogin = () => {
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

  const validateSignUp = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

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

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await login(email.trim(), password);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setErrors({ email: err.message || 'Invalid email or password' });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await register(name.trim(), email.trim(), password);
      setIsLoading(false);
      navigate('/dashboard');
    } catch (err) {
      setIsLoading(false);
      setErrors({ email: err.message || 'Registration failed' });
    }
  };

  const handleSubmit = isSignUp ? handleRegister : handleLogin;

  const toggleMode = (e) => {
    e.preventDefault();
    setMode(isSignUp ? 'login' : 'signup');
    setErrors({});
    setName('');
    setConfirmPassword('');
  };

  const onForgotPassword = (e) => {
    e.preventDefault();
    /* TODO: route to password-reset flow */
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`login-page${isDark ? ' login-page--dark' : ''}`}
      id="login-page"
    >
      <ThemeToggle className="login-theme-toggle" />
      <div className="login-form-side">
        <div className="login-form-inner">
          <div className="login-brand">
            <span className="login-brand-icon" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="4" y="6" width="20" height="3" rx="1.5" fill="#E44332"/>
                <rect x="4" y="12.5" width="20" height="3" rx="1.5" fill="#E44332" opacity="0.75"/>
                <rect x="4" y="19" width="20" height="3" rx="1.5" fill="#E44332" opacity="0.5"/>
              </svg>
            </span>
            <span className="login-brand-name">TaskFlow</span>
          </div>

          <div className="login-header">
            <h1 className="login-title">
              {isSignUp ? 'Create account' : 'Welcome back!'}
            </h1>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            id={isSignUp ? 'signup-form' : 'login-form'}
            noValidate
          >
            {isSignUp && (
              <div className="lf-input-group">
                <label htmlFor="signup-name" className="lf-label">Name</label>
                <input
                  type="text"
                  id="signup-name"
                  className={`lf-input${errors.name ? ' lf-input--error' : ''}`}
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  autoComplete="name"
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && (
                  <span className="lf-error" id="name-error" role="alert">{errors.name}</span>
                )}
              </div>
            )}

            <div className="lf-input-group">
              <label htmlFor="login-email" className="lf-label">Email</label>
              <input
                type="text"
                id="login-email"
                className={`lf-input${errors.email ? ' lf-input--error' : ''}`}
                placeholder={isSignUp ? 'Enter your personal or work email...' : 'Enter your email...'}
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                autoComplete="email"
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <span className="lf-error" id="email-error" role="alert">{errors.email}</span>
              )}
            </div>

            <div className="lf-input-group">
              <label htmlFor="login-password" className="lf-label">Password</label>
              <input
                type="password"
                id="login-password"
                className={`lf-input${errors.password ? ' lf-input--error' : ''}`}
                placeholder="Enter your password..."
                value={password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <span className="lf-error" id="password-error" role="alert">{errors.password}</span>
              )}
            </div>

            {isSignUp && (
              <div className="lf-input-group">
                <label htmlFor="signup-confirm-password" className="lf-label">Confirm password</label>
                <input
                  type="password"
                  id="signup-confirm-password"
                  className={`lf-input${errors.confirmPassword ? ' lf-input--error' : ''}`}
                  placeholder="Confirm your password..."
                  value={confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  autoComplete="new-password"
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                {errors.confirmPassword && (
                  <span className="lf-error" id="confirm-password-error" role="alert">
                    {errors.confirmPassword}
                  </span>
                )}
              </div>
            )}

            {!isSignUp && (
              <div className="lf-control-row">
                <label className="lf-checkbox-label" htmlFor="remember-me">
                  <input
                    type="checkbox"
                    id="remember-me"
                    className="lf-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="lf-checkbox-custom" aria-hidden="true" />
                  Remember me
                </label>

                <a href="#forgot" className="lf-forgot-link" onClick={onForgotPassword}>
                  Forgot your password?
                </a>
              </div>
            )}

            <button
              type="submit"
              className="lf-submit-btn"
              disabled={isLoading}
              id={isSignUp ? 'signup-submit-btn' : 'login-submit-btn'}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="lf-spinner" aria-hidden="true" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                isSignUp ? 'Sign up' : 'Log in'
              )}
            </button>
          </form>

          <p className="lf-signup-prompt">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button type="button" className="lf-signup-link" onClick={toggleMode}>
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button type="button" className="lf-signup-link" onClick={toggleMode}>
                  Sign up
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      <div className="login-visual-side" aria-hidden="true">
        <div className="login-visual-content">
          <div className="login-visual-card">
            <div className="visual-card-line visual-card-line--long" />
            <div className="visual-card-line visual-card-line--medium" />
            <div className="visual-card-line visual-card-line--short" />
          </div>
          <div className="login-visual-card login-visual-card--offset">
            <div className="visual-card-line visual-card-line--medium" />
            <div className="visual-card-line visual-card-line--long" />
          </div>
          <div className="login-visual-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E44332" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        </div>
        {isSignUp && (
          <div className="login-visual-caption">
            <h2>Take TaskFlow with you</h2>
            <p>Stay organized wherever you are and keep every task in sync.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
