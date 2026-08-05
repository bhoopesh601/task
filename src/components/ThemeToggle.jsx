import useLocalStorage from '../hooks/useLocalStorage';

/**
 * ThemeToggle - Toggles between light and dark themes.
 * Persists the selected theme to localStorage under 'theme'.
 * Applies theme via data-theme attribute on <html>.
 */
const ThemeToggle = ({ className = '' }) => {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  // Apply theme to document root
  document.documentElement.setAttribute('data-theme', theme);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      id="theme-toggle-btn"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;
