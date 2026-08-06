import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTodos } from '../context/TodoContext';
import ThemeToggle from './ThemeToggle';

/**
 * SettingsView — Application Settings Page
 * Grouped under Organization and Customization section headings with icon grid cards.
 * Manages profile information, default priority/sort preferences, and theme options.
 */
const SettingsView = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { sortBy, setSortBy, showToast } = useTodos();

  const [profileName, setProfileName] = useState(user?.name || user?.email?.split('@')[0] || 'User');
  const [profileEmail, setProfileEmail] = useState(user?.email || 'user@example.com');
  const [defaultPriority, setDefaultPriority] = useState('Medium');
  const [taskNotification, setTaskNotification] = useState(true);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    showToast('Profile updated successfully! 👤');
  };

  const handleSaveDefaults = (e) => {
    e.preventDefault();
    showToast('Preferences saved! ⚙️');
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="settings-subtitle">
          Manage your account profile, task defaults, and display preferences.
        </p>
      </div>

      {/* SECTION 1: ORGANIZATION */}
      <section className="settings-section">
        <h3 className="settings-section-title">
          <span className="section-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.5 3H7a2 2 0 0 0-2 2v11" />
              <path d="M9 7h8.5L21 11.5V20a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
              <polyline points="15.5 3 15.5 7.5 20 7.5" />
              <line x1="10" y1="12" x2="17" y2="12" />
              <line x1="10" y1="15" x2="17" y2="15" />
            </svg>
          </span>
          Organization
        </h3>

        <div className="settings-grid">
          {/* Card 1: User Profile */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-box icon-profile">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="card-title-meta">
                <h4>Profile Information</h4>
                <p>Manage your account name and email</p>
              </div>
            </div>
            <form onSubmit={handleSaveProfile} className="settings-card-body">
              <div className="settings-field">
                <label htmlFor="settings-name">Full Name</label>
                <input
                  type="text"
                  id="settings-name"
                  className="input-field"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="settings-field">
                <label htmlFor="settings-email">Email Address</label>
                <input
                  type="email"
                  id="settings-email"
                  className="input-field"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Profile
              </button>
            </form>
          </div>

          {/* Card 2: Task Defaults */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-box icon-tasks">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="card-title-meta">
                <h4>Todo Preferences</h4>
                <p>Set default priority and list ordering</p>
              </div>
            </div>
            <form onSubmit={handleSaveDefaults} className="settings-card-body">
              <div className="settings-field">
                <label htmlFor="default-priority">Default Task Priority</label>
                <select
                  id="default-priority"
                  className="select-field"
                  value={defaultPriority}
                  onChange={(e) => setDefaultPriority(e.target.value)}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="settings-field">
                <label htmlFor="default-sort">Default Task Sorting</label>
                <select
                  id="default-sort"
                  className="select-field"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="latest">Latest Created</option>
                  <option value="dueDate">Due Date</option>
                  <option value="priority">Priority</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                Save Defaults
              </button>
            </form>
          </div>

          {/* Card 3: Priority & Status Overview */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-box icon-priorities">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div className="card-title-meta">
                <h4>Priorities & Statuses</h4>
                <p>Configured task priorities and workflow statuses</p>
              </div>
            </div>
            <div className="settings-card-body">
              <div className="status-badges-list">
                <div className="badge-item">
                  <span className="badge-chip priority-high">High Priority</span>
                  <span className="badge-desc">Urgent tasks with immediate deadlines</span>
                </div>
                <div className="badge-item">
                  <span className="badge-chip priority-medium">Medium Priority</span>
                  <span className="badge-desc">Standard daily operations</span>
                </div>
                <div className="badge-item">
                  <span className="badge-chip priority-low">Low Priority</span>
                  <span className="badge-desc">Low urgency or optional tasks</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: CUSTOMIZATION */}
      <section className="settings-section">
        <h3 className="settings-section-title">
          <span className="section-icon">🎨</span> Customization
        </h3>

        <div className="settings-grid">
          {/* Card 1: Theme Management */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-box icon-theme">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div className="card-title-meta">
                <h4>Appearance & Theme</h4>
                <p>Global light and dark mode preference</p>
              </div>
            </div>
            <div className="settings-card-body theme-toggle-row">
              <div className="theme-meta">
                <span className="theme-current-label">Current Mode: <strong>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong></span>
                <span className="theme-subtext">Applies globally across all pages</span>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Card 2: Notifications & Reminders */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="card-icon-box icon-notifications">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="card-title-meta">
                <h4>Task Reminders</h4>
                <p>Manage in-app task notification toasts</p>
              </div>
            </div>
            <div className="settings-card-body">
              <label className="settings-toggle-label">
                <span>Enable task operation notifications</span>
                <input
                  type="checkbox"
                  checked={taskNotification}
                  onChange={(e) => setTaskNotification(e.target.checked)}
                  className="settings-checkbox"
                />
              </label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsView;
