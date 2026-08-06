import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { sortTodos, filterTodos, searchTodos } from '../utils/helpers';
import { apiFetch } from '../utils/api';

const TodoContext = createContext(null);

/**
 * TodoProvider manages all todo state including CRUD, search, filter, and sort.
 * Strictly fetches and manipulates data for the authenticated user via /api/todos.
 */
export const TodoProvider = ({ children }) => {
  const { user } = useAuth();
  const [todos, setTodos] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch todos from backend API for the current authenticated user
  const fetchTodos = useCallback(async () => {
    if (!user) {
      setTodos([]);
      return;
    }
    try {
      const res = await apiFetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
      } else {
        setTodos([]);
      }
    } catch {
      setTodos([]);
    }
  }, [user]);

  // Re-fetch todos whenever authenticated user changes
  useEffect(() => {
    fetchTodos();
  }, [fetchTodos, user]);

  // CRUD Operations
  const addTodo = useCallback(async (todoData) => {
    try {
      const res = await apiFetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(todoData),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [newTodo, ...prev]);
        showToast('Todo added successfully! ✅');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to add todo', 'error');
      }
    } catch (err) {
      showToast('Error adding todo', 'error');
    }
  }, [showToast]);

  const updateTodo = useCallback(async (id, updatedData) => {
    try {
      const res = await apiFetch(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
        showToast('Todo updated successfully! ✏️');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to update todo', 'error');
      }
    } catch {
      showToast('Error updating todo', 'error');
    }
  }, [showToast]);

  const deleteTodo = useCallback(async (id) => {
    try {
      const res = await apiFetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        showToast('Todo deleted successfully! 🗑️', 'error');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to delete todo', 'error');
      }
    } catch {
      showToast('Error deleting todo', 'error');
    }
  }, [showToast]);

  const toggleStatus = useCallback(async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const newStatus = target.status === 'Pending' ? 'Completed' : 'Pending';

    try {
      const res = await apiFetch(`/api/todos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
    } catch {
      /* ignore toggle errors */
    }
  }, [todos]);

  // Computed / derived data with search, filter, and sort applied
  const processedTodos = useMemo(() => {
    let result = todos;
    result = searchTodos(result, searchQuery);
    result = filterTodos(result, activeFilter);
    result = sortTodos(result, sortBy);
    return result;
  }, [todos, searchQuery, activeFilter, sortBy]);

  // Statistics derived exclusively from user's isolated todos
  const stats = useMemo(() => ({
    total: todos.length,
    completed: todos.filter((t) => t.status === 'Completed').length,
    pending: todos.filter((t) => t.status === 'Pending').length,
    highPriority: todos.filter((t) => t.priority === 'High').length,
  }), [todos]);

  const value = useMemo(
    () => ({
      todos,
      processedTodos,
      stats,
      searchQuery,
      setSearchQuery,
      activeFilter,
      setActiveFilter,
      sortBy,
      setSortBy,
      addTodo,
      updateTodo,
      deleteTodo,
      toggleStatus,
      toast,
      showToast,
      refreshTodos: fetchTodos,
    }),
    [todos, processedTodos, stats, searchQuery, activeFilter, sortBy, addTodo, updateTodo, deleteTodo, toggleStatus, toast, showToast, fetchTodos]
  );

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};

/**
 * Custom hook to access todo context
 */
export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export default TodoContext;
