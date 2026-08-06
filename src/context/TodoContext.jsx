import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { generateId, sampleTodos, sortTodos, filterTodos, searchTodos } from '../utils/helpers';

const TodoContext = createContext(null);

/**
 * TodoProvider manages all todo state including CRUD, search, filter, and sort.
 * Connects to /api/todos backend with fallback to localStorage.
 */
export const TodoProvider = ({ children }) => {
  const [localTodos, setLocalTodos] = useLocalStorage('todos', sampleTodos);
  const [todos, setTodos] = useState(localTodos);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  // Toast notification state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch todos from backend API
  const fetchTodos = useCallback(async () => {
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data);
        setLocalTodos(data);
      }
    } catch {
      /* Fallback to local storage state if backend offline */
    }
  }, [setLocalTodos]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  // CRUD Operations
  const addTodo = useCallback(async (todoData) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todoData),
      });

      if (res.ok) {
        const newTodo = await res.json();
        setTodos((prev) => [newTodo, ...prev]);
        showToast('Todo added successfully! ✅');
        return;
      }
    } catch {
      /* fallback below */
    }

    // Fallback if offline
    const newTodo = {
      ...todoData,
      id: generateId(),
      createdDate: new Date().toISOString(),
      status: 'Pending',
    };
    setTodos((prev) => [newTodo, ...prev]);
    setLocalTodos((prev) => [newTodo, ...prev]);
    showToast('Todo added successfully! ✅');
  }, [setLocalTodos, showToast]);

  const updateTodo = useCallback(async (id, updatedData) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
        showToast('Todo updated successfully! ✏️');
        return;
      }
    } catch {
      /* fallback below */
    }

    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updatedData } : todo))
    );
    setLocalTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, ...updatedData } : todo))
    );
    showToast('Todo updated successfully! ✏️');
  }, [setLocalTodos, showToast]);

  const deleteTodo = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTodos((prev) => prev.filter((t) => t.id !== id));
        showToast('Todo deleted successfully! 🗑️', 'error');
        return;
      }
    } catch {
      /* fallback below */
    }

    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    setLocalTodos((prev) => prev.filter((todo) => todo.id !== id));
    showToast('Todo deleted successfully! 🗑️', 'error');
  }, [setLocalTodos, showToast]);

  const toggleStatus = useCallback(async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;

    const newStatus = target.status === 'Pending' ? 'Completed' : 'Pending';

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
        return;
      }
    } catch {
      /* fallback below */
    }

    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, status: newStatus } : todo
      )
    );
    setLocalTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, status: newStatus } : todo
      )
    );
  }, [todos, setLocalTodos]);

  // Computed / derived data with search, filter, and sort applied
  const processedTodos = useMemo(() => {
    let result = todos;
    result = searchTodos(result, searchQuery);
    result = filterTodos(result, activeFilter);
    result = sortTodos(result, sortBy);
    return result;
  }, [todos, searchQuery, activeFilter, sortBy]);

  // Statistics
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
