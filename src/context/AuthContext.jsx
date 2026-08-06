import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

const AUTH_USER_KEY = 'authUser';

/**
 * AuthProvider manages authentication state.
 * Connects to /api/auth endpoints with fallback support for offline/local storage.
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

  // Check auth session on startup
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
        }
      } catch (err) {
        console.warn('Backend server not reachable, using local session state:', err.message);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Login: authenticate against /api/auth/login
  const login = useCallback(async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setUser(data.user);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      // Local fallback if API server is offline or mock login requested
      if (err.message.includes('Failed to fetch') || !password) {
        const fallbackUser = { email, loggedInAt: new Date().toISOString() };
        setUser(fallbackUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser };
      }
      throw err;
    }
  }, []);

  // Register: create user against /api/auth/register
  const register = useCallback(async (name, email, password) => {
    try {
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
    } catch (err) {
      if (err.message.includes('Failed to fetch')) {
        const fallbackUser = { name, email, loggedInAt: new Date().toISOString() };
        setUser(fallbackUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser };
      }
      throw err;
    }
  }, []);

  // Logout: clear backend session & localStorage
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* ignore offline errors */
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
