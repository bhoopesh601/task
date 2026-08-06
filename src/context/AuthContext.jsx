import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

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
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
        } else {
          setUser(null);
          localStorage.removeItem(AUTH_USER_KEY);
        }
      } catch (err) {
        console.warn('Auth check error:', err.message);
        setUser(null);
        localStorage.removeItem(AUTH_USER_KEY);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login: strictly authenticate against /api/auth/login
  const login = useCallback(async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Invalid email or password');
    }

    setUser(data.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  }, []);

  // Register: strictly create user against /api/auth/register
  const register = useCallback(async (name, email, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setUser(data.user);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    return { success: true, user: data.user };
  }, []);

  // Logout: clear backend session & localStorage
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore errors */
    } finally {
      setUser(null);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      register,
      logout,
    }),
    [user, loading, login, register, logout]
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
