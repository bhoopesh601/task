import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

/**
 * Navbar — Left sidebar navigation with brand, user info, navigation items, theme toggle, and logout.
 * Vertical Navigation Order:
 * 1. Dashboard
 * 2. My Todos
 * 3. Settings
 */
const Navbar = ({ activeNav: externalActiveNav, onSelectNav, isCollapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const [internalActiveNav, setInternalActiveNav] = useState('todos');

  const activeNav = externalActiveNav || internalActiveNav;

  const handleNavClick = (navKey) => {
    if (onSelectNav) {
      onSelectNav(navKey);
    } else {
      setInternalActiveNav(navKey);
    }
  };

  const getInitials = (userData) => {
    const nameStr = userData?.name?.trim();
    if (nameStr) return nameStr.charAt(0).toUpperCase();
    const emailStr = userData?.email?.trim();
    if (emailStr) return emailStr.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`} id="main-navbar">
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <span className="sidebar-logo" aria-hidden="true" onClick={onToggle} style={{ cursor: 'pointer' }} title="Toggle Sidebar">
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="6" width="20" height="3" rx="1.5" fill="#E44332"/>
              <rect x="4" y="12.5" width="20" height="3" rx="1.5" fill="#E44332" opacity="0.75"/>
              <rect x="4" y="19" width="20" height="3" rx="1.5" fill="#E44332" opacity="0.5"/>
            </svg>
          </span>
          <span className="sidebar-title">TaskFlow</span>
        </div>

        <div className="sidebar-user" id="user-info">
          <div className="sidebar-user-avatar">{getInitials(user)}</div>
          <span className="sidebar-user-email">{user?.email}</span>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {/* 1. Dashboard */}
          <a
            href="#dashboard"
            className={`sidebar-nav-item ${activeNav === 'dashboard' ? 'sidebar-nav-item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('dashboard');
            }}
            id="nav-dashboard"
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
            </span>
            <span className="nav-text">Dashboard</span>
          </a>

          {/* 2. My Todos */}
          <a
            href="#todos"
            className={`sidebar-nav-item ${activeNav === 'todos' ? 'sidebar-nav-item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('todos');
            }}
            id="nav-todos"
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="nav-text">My Todos</span>
          </a>

          {/* 3. Settings */}
          <a
            href="#settings"
            className={`sidebar-nav-item ${activeNav === 'settings' ? 'sidebar-nav-item--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('settings');
            }}
            id="nav-settings"
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="nav-text">Settings</span>
          </a>
        </nav>
      </div>

      <div className="sidebar-bottom">
        <ThemeToggle />
        <button className="sidebar-logout-btn" onClick={logout} id="logout-btn">
          <span className="sidebar-nav-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          <span className="nav-text">Log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Navbar;
