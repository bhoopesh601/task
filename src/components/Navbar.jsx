import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

/**
 * Navbar - Sticky top navigation bar with brand, user info, theme toggle, and logout.
 */
const Navbar = () => {
  const { user, logout } = useAuth();

  // Get user initials for the avatar
  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="navbar-brand">
          <div className="navbar-logo">📋</div>
          <h1 className="navbar-title">
            Todo<span>App</span>
          </h1>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* User info */}
          <div className="navbar-user" id="user-info">
            <div className="navbar-user-avatar">{getInitials(user?.email)}</div>
            <span>{user?.email}</span>
          </div>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Logout */}
          <button className="logout-btn" onClick={logout} id="logout-btn">
            <span>🚪</span>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
