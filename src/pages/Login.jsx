import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';
import { isValidEmail } from '../utils/helpers';
import { sendOtp, resetPassword } from '../utils/api';
import '../styles/login.css';


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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // 'email' | 'reset' | 'success'
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { theme } = useTheme();
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const isSignUp = mode === 'signup';

  // Countdown timer for OTP Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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
      setErrors({ password: err.message || 'Invalid email or password' });
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
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Forgot Password Modal Handlers
  const onForgotPassword = (e) => {
    e.preventDefault();
    setIsForgotOpen(true);
    setForgotStep('email');
    setForgotEmail(email.trim());
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotError('');
    setForgotSuccessMsg('');
  };

  const closeForgotModal = () => {
    setIsForgotOpen(false);
    setForgotError('');
    setForgotSuccessMsg('');
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your account email address.');
      return;
    }
    if (!isValidEmail(forgotEmail.trim())) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await sendOtp(forgotEmail.trim(), 'password-reset');
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Failed to send OTP. Please check the email.');
        setForgotLoading(false);
        return;
      }

      setForgotSuccessMsg(data.message || 'Verification code sent to your Hostinger inbox.');
      setForgotStep('reset');
      setResendCooldown(60);
    } catch (err) {
      setForgotError(err.message || 'Network error sending verification code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || forgotLoading) return;
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await sendOtp(forgotEmail.trim(), 'password-reset');
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Failed to resend verification code.');
      } else {
        setResendCooldown(60);
        setForgotSuccessMsg('A new 6-digit code has been sent to your email.');
      }
    } catch (err) {
      setForgotError(err.message || 'Network error resending code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');

    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit code sent to your email.');
      return;
    }
    if (!forgotNewPassword.trim()) {
      setForgotError('Please enter your new password.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), forgotNewPassword);
      const data = await res.json();

      if (!res.ok) {
        setForgotError(data.error || 'Failed to reset password. Please check your verification code.');
        setForgotLoading(false);
        return;
      }

      setForgotStep('success');
      setEmail(forgotEmail.trim());
      setPassword(forgotNewPassword);
    } catch (err) {
      setForgotError(err.message || 'Network error resetting password.');
    } finally {
      setForgotLoading(false);
    }
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
              <div className="lf-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className={`lf-input${errors.password ? ' lf-input--error' : ''}`}
                  placeholder="Enter your password..."
                  value={password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  className="lf-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="lf-error" id="password-error" role="alert">{errors.password}</span>
              )}
            </div>

            {isSignUp && (
              <div className="lf-input-group">
                <label htmlFor="signup-confirm-password" className="lf-label">Confirm password</label>
                <div className="lf-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="signup-confirm-password"
                    className={`lf-input${errors.confirmPassword ? ' lf-input--error' : ''}`}
                    placeholder="Confirm your password..."
                    value={confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                    aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="lf-password-toggle"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
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

      {/* Forgot Password Modal Dialog */}
      {isForgotOpen && (
        <div className="fp-overlay" onClick={closeForgotModal} role="dialog" aria-modal="true" aria-labelledby="fp-title">
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fp-close-btn"
              onClick={closeForgotModal}
              aria-label="Close dialog"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {forgotStep === 'email' && (
              <div className="fp-content">
                <div className="fp-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E44332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h2 id="fp-title" className="fp-title">Reset your password</h2>
                <p className="fp-subtitle">
                  Enter the email associated with your account. We will send a 6-digit verification code to your inbox.
                </p>

                {forgotError && (
                  <div className="fp-alert fp-alert--error" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleSendForgotOtp} className="fp-form" noValidate>
                  <div className="lf-input-group">
                    <label htmlFor="fp-email" className="lf-label">Email address</label>
                    <input
                      type="email"
                      id="fp-email"
                      className="lf-input"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="fp-btn-row">
                    <button
                      type="button"
                      className="fp-cancel-btn"
                      onClick={closeForgotModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="lf-submit-btn fp-submit-btn"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <>
                          <span className="lf-spinner" aria-hidden="true" />
                          Sending code…
                        </>
                      ) : (
                        'Send verification code'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {forgotStep === 'reset' && (
              <div className="fp-content">
                <div className="fp-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E44332" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h2 id="fp-title" className="fp-title">Enter verification code</h2>
                <p className="fp-subtitle">
                  We sent a 6-digit verification code to <strong>{forgotEmail}</strong>.
                </p>

                {forgotSuccessMsg && (
                  <div className="fp-alert fp-alert--success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                {forgotError && (
                  <div className="fp-alert fp-alert--error" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>{forgotError}</span>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="fp-form" noValidate>
                  <div className="lf-input-group">
                    <div className="fp-label-row">
                      <label htmlFor="fp-otp" className="lf-label">6-Digit Code</label>
                      <button
                        type="button"
                        className="fp-resend-btn"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || forgotLoading}
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                    <input
                      type="text"
                      id="fp-otp"
                      className="lf-input fp-otp-input"
                      placeholder="123456"
                      maxLength={6}
                      inputMode="numeric"
                      value={forgotOtp}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setForgotOtp(val);
                        if (forgotError) setForgotError('');
                      }}
                      autoFocus
                    />
                  </div>

                  <div className="lf-input-group">
                    <label htmlFor="fp-new-password" className="lf-label">New password</label>
                    <div className="lf-input-wrapper">
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        id="fp-new-password"
                        className="lf-input"
                        placeholder="At least 6 characters"
                        value={forgotNewPassword}
                        onChange={(e) => {
                          setForgotNewPassword(e.target.value);
                          if (forgotError) setForgotError('');
                        }}
                      />
                      <button
                        type="button"
                        className="lf-password-toggle"
                        onClick={() => setShowForgotNewPassword((prev) => !prev)}
                        aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showForgotNewPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="lf-input-group">
                    <label htmlFor="fp-confirm-password" className="lf-label">Confirm new password</label>
                    <div className="lf-input-wrapper">
                      <input
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        id="fp-confirm-password"
                        className="lf-input"
                        placeholder="Re-enter new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => {
                          setForgotConfirmPassword(e.target.value);
                          if (forgotError) setForgotError('');
                        }}
                      />
                      <button
                        type="button"
                        className="lf-password-toggle"
                        onClick={() => setShowForgotConfirmPassword((prev) => !prev)}
                        aria-label={showForgotConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showForgotConfirmPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                            <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                            <line x1="2" y1="2" x2="22" y2="22" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="fp-btn-row">
                    <button
                      type="button"
                      className="fp-cancel-btn"
                      onClick={() => {
                        setForgotStep('email');
                        setForgotError('');
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="lf-submit-btn fp-submit-btn"
                      disabled={forgotLoading}
                    >
                      {forgotLoading ? (
                        <>
                          <span className="lf-spinner" aria-hidden="true" />
                          Updating…
                        </>
                      ) : (
                        'Save new password'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {forgotStep === 'success' && (
              <div className="fp-content fp-content--success">
                <div className="fp-icon-wrap fp-icon-wrap--success">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2 id="fp-title" className="fp-title">Password updated!</h2>
                <p className="fp-subtitle">
                  Your password has been successfully reset. You can now log in to TaskFlow with your new credentials.
                </p>

                <button
                  type="button"
                  className="lf-submit-btn fp-submit-btn"
                  onClick={closeForgotModal}
                >
                  Back to Log In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;

