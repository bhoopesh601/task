import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

/**
 * Navbar — Left sidebar navigation with brand, user info, theme toggle, and logout.
 */
const Navbar = () => {
  const { user, logout } = useAuth();

  const getInitials = (email) => {
    if (!email) return '?';
    return email.charAt(0).toUpperCase();
  };

  return (
    <aside className="sidebar" id="main-navbar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="6" width="20" height="3" rx="1.5" fill="#E44332"/>
              <rect x="4" y="12.5" width="20" height="3" rx="1.5" fill="#E44332" opacity="0.75"/>
              <rect x="4" y="19" width="20" height="3" rx="1.5" fill="#E44332" opacity="0.5"/>
            </svg>
          </span>
          <span className="sidebar-title">TaskFlow</span>
        </div>

        <div className="sidebar-user" id="user-info">
          <div className="sidebar-user-avatar">{getInitials(user?.email)}</div>
          <span className="sidebar-user-email">{user?.email}</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <a href="#dashboard" className="sidebar-nav-item sidebar-nav-item--active">
            <span className="sidebar-nav-icon" aria-hidden="true">📥</span>
            My Todos
          </a>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <ThemeToggle />
        <button className="sidebar-logout-btn" onClick={logout} id="logout-btn">
          Log out
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
