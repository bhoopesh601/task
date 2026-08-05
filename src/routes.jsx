import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

/**
 * ProtectedRoute - Redirects to login if user is not authenticated.
 * Used to guard the dashboard route.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * PublicRoute - Redirects to dashboard if user is already authenticated.
 * Used to prevent logged-in users from seeing the login page.
 */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

/**
 * Route configuration for the application.
 * - / → Login (public, redirects to dashboard if logged in)
 * - /dashboard → Dashboard (protected)
 * - * → 404 NotFound
 */
export const routeConfig = [
  {
    path: '/',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
