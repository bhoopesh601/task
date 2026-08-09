import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { apiFetch } from '../utils/api';

const AuthContext = createContext(null);

const AUTH_USER_KEY = 'authUser';

/**
 * AuthProvider manages authentication state.
 * Strictly verifies user credentials against database API (/api/auth).
 * No auto-registration or mock login fallback allowed.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Check auth session on startup against /api/auth/me
  // The Bearer token stored in localStorage is sent automatically by apiFetch,
  // so this works even when cross-origin cookies are blocked by the browser.
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      // If no token exists at all, we are definitely logged out
      if (!storedToken) {
        setUser(null);
        localStorage.removeItem(AUTH_USER_KEY);
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        } else {
          // Token is invalid or expired — clear everything
          setUser(null);
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.warn('Auth check error:', err.message);
        // Network error: keep the cached user so UI doesn't flicker on reconnect
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch { setUser(null); }
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login with OTP: authenticate via /api/auth/verify-otp with action 'login'
  const loginWithOtp = useCallback(async (email, otp) => {
    const res = await apiFetch('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, action: 'login' }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid verification code');
    }

    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user, token: data.token };
  }, []);

  // Login: authenticate against /api/auth/login (password fallback)
  const login = useCallback(async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password');
    }

    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user, token: data.token };
  }, []);

  // Register: create user against /api/auth/register with verified OTP
  const register = useCallback(async (name, email, password, otp) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, otp }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user, token: data.token };
  }, []);

  // Logout: clear backend session & localStorage (including stored JWT)
  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore errors */
    } finally {
      setUser(null);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem('token'); // Remove Bearer token so no stale auth remains
    }
  }, []);

  // Update Profile: update user credentials against /api/auth/profile
  const updateProfile = useCallback(async (name, email) => {
    const res = await apiFetch('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }

    if (data.token) localStorage.setItem('token', data.token);
    setUser(data.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      loginWithOtp,
      register,
      logout,
      updateProfile,
    }),
    [user, loading, login, loginWithOtp, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
