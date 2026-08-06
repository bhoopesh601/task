// Base API URL Configuration
// When deploying frontend and backend separately, set VITE_API_URL or use your Render URL here:
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://task-1-zih4.onrender.com';

/**
 * Helper function for making API calls to backend
 * @param {string} endpoint - API path (e.g. '/api/auth/login')
 * @param {Object} options - fetch options
 */
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: options.credentials || 'include',
  });

  return response;
};

export default apiFetch;
