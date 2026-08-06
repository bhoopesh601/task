import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { sortTodos, filterTodos, searchTodos } from '../utils/helpers';
import { apiFetch } from '../utils/api';

const TodoContext = createContext(null);

/**
 * TodoProvider manages all todo state including CRUD, search, filter, and sort.
 * Each user's todos are strictly isolated — todos are cleared immediately
 * whenever the logged-in user changes, then re-fetched for the new user.
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

  // Track the current userId so we can detect user switches
  const currentUserIdRef = useRef(user?.id ?? null);

  // Fetch todos from backend API for the current authenticated user.
  // Uses a cancellation flag to discard stale responses if the user
  // changes while a fetch is in flight.
  const fetchTodos = useCallback(async (signal) => {
    if (!user) {
      setTodos([]);
      return;
    }
    try {
      const res = await apiFetch('/api/todos');
      // Discard response if user changed while request was in flight
      if (signal?.aborted) return;
      if (res.ok) {
        const data = await res.json();
        if (!signal?.aborted) setTodos(data);
      } else {
        if (!signal?.aborted) setTodos([]);
      }
    } catch {
      if (!signal?.aborted) setTodos([]);
    }
  }, [user]);

  // Whenever the user identity changes (login / logout / switch account):
  //   1. Immediately wipe todos so no stale data is shown
  //   2. Fetch fresh todos for the new user
  //   3. Abort any in-flight fetch from the previous user
  useEffect(() => {
    const newUserId = user?.id ?? null;

    // Always clear todos first to prevent cross-user data leakage
    setTodos([]);
    currentUserIdRef.current = newUserId;

    if (!newUserId) return; // Logged out — nothing to fetch

    // AbortController lets us cancel the fetch if user changes again quickly
    const controller = new AbortController();
    fetchTodos(controller.signal);

    return () => {
      controller.abort(); // Cleanup: cancel fetch on unmount or user change
    };
  }, [user?.id]); // Depend only on userId — not the whole user object

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

  // Manual refresh (e.g. pull-to-refresh) — no abort signal needed
  const refreshTodos = useCallback(() => fetchTodos(), [fetchTodos]);

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
      refreshTodos,
    }),
    [todos, processedTodos, stats, searchQuery, activeFilter, sortBy, addTodo, updateTodo, deleteTodo, toggleStatus, toast, showToast, refreshTodos]
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
