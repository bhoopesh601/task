import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isValidEmail } from '../utils/helpers';
import '../styles/login.css';

/**
 * Login Page — Clean pre-authentication portal.
 * Todoist-inspired split layout: form (left) + decorative panel (right).
 * No post-login data, mock OAuth, or internal app content is shown here.
 */
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    setTimeout(() => {
      login(email);
      setIsLoading(false);
      navigate('/dashboard');
    }, 600);
  };

  const handleInputChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const onForgotPassword = (e) => {
    e.preventDefault();
    /* TODO: route to password-reset flow */
  };

  return (
    <div className="login-page" id="login-page">
      {/* Left — Login form */}
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
            <h1 className="login-title">Welcome back!</h1>
          </div>

          <form className="login-form" onSubmit={handleLogin} id="login-form" noValidate>
            <div className="lf-input-group">
              <label htmlFor="login-email" className="lf-label">Email</label>
              <input
                type="text"
                id="login-email"
                className={`lf-input${errors.email ? ' lf-input--error' : ''}`}
                placeholder="Enter your email..."
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
                autoComplete="current-password"
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <span className="lf-error" id="password-error" role="alert">{errors.password}</span>
              )}
            </div>

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

            <button
              type="submit"
              className="lf-submit-btn"
              disabled={isLoading}
              id="login-submit-btn"
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="lf-spinner" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="lf-signup-prompt">
            Don&apos;t have an account?{' '}
            <a href="#signup" className="lf-signup-link">Sign up</a>
          </p>
        </div>
      </div>

      {/* Right — Decorative panel (no app data) */}
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
      </div>
    </div>
  );
};

export default Login;
