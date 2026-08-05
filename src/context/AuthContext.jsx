import { createContext, useContext, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';

const AuthContext = createContext(null);

/**
 * AuthProvider manages authentication state.
 * Stores the logged-in user in localStorage under 'authUser'.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('authUser', null);

  // Login: stores user info in localStorage
  const login = (email) => {
    const userData = { email, loggedInAt: new Date().toISOString() };
    setUser(userData);
  };

  // Logout: clears user from localStorage
  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user]
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
