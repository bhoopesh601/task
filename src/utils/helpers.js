/**
 * Utility helper functions for the Todo Application
 */

/**
 * Generate a unique ID for new todos
 * Uses timestamp + random number for uniqueness
 */
export const generateId = () => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

/**
 * Get today's date in YYYY-MM-DD format (for date input min values)
 */
export const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Get priority color based on priority level
 * @param {string} priority - 'Low', 'Medium', or 'High'
 * @returns {string} CSS color variable reference
 */
export const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High':
      return 'var(--priority-high)';
    case 'Medium':
      return 'var(--priority-medium)';
    case 'Low':
      return 'var(--priority-low)';
    default:
      return 'var(--text-secondary)';
  }
};

/**
 * Get status badge color
 * @param {string} status - 'Pending' or 'Completed'
 * @returns {string}
 */
export const getStatusColor = (status) => {
  return status === 'Completed' ? 'var(--status-completed)' : 'var(--status-pending)';
};

/**
 * Sort todos by the given criteria
 * @param {Array} todos - Array of todo objects
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted array
 */
export const sortTodos = (todos, sortBy) => {
  const sorted = [...todos];
  switch (sortBy) {
    case 'dueDate':
      return sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    case 'priority': {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      return sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    case 'latest':
      return sorted.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
};

/**
 * Filter todos by the given filter type
 * @param {Array} todos - Array of todo objects
 * @param {string} filter - Filter type
 * @returns {Array} Filtered array
 */
export const filterTodos = (todos, filter) => {
  switch (filter) {
    case 'pending':
      return todos.filter((todo) => todo.status === 'Pending');
    case 'completed':
      return todos.filter((todo) => todo.status === 'Completed');
    case 'high':
      return todos.filter((todo) => todo.priority === 'High');
    case 'medium':
      return todos.filter((todo) => todo.priority === 'Medium');
    case 'low':
      return todos.filter((todo) => todo.priority === 'Low');
    default:
      return todos;
  }
};

/**
 * Search todos by title or description
 * @param {Array} todos - Array of todo objects
 * @param {string} query - Search query
 * @returns {Array} Matching todos
 */
export const searchTodos = (todos, query) => {
  if (!query.trim()) return todos;
  const lowerQuery = query.toLowerCase();
  return todos.filter(
    (todo) =>
      todo.title.toLowerCase().includes(lowerQuery) ||
      todo.description.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Sample todo data for initial load
 */
export const sampleTodos = [
  {
    id: 1,
    title: 'Complete React Assignment',
    description: 'Finish Todo Project',
    priority: 'High',
    status: 'Pending',
    dueDate: '2026-08-10',
    createdDate: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Study Java',
    description: 'Prepare for exam',
    priority: 'Medium',
    status: 'Completed',
    dueDate: '2026-08-12',
    createdDate: new Date().toISOString(),
  },
];
