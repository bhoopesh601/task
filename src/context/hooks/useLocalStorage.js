import { useState, useEffect } from 'react';

/**
 * Custom hook for syncing state with localStorage.
 * Reads initial value from localStorage (or uses fallback),
 * and persists every state change back to localStorage.
 *
 * @param {string} key - The localStorage key
 * @param {*} initialValue - Fallback value if key doesn't exist
 * @returns {[*, Function]} - [storedValue, setValue]
 */
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
};

export default useLocalStorage;
