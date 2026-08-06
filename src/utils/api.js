// Base API URL Resolution
const getApiBaseUrl = () => {
  // 1. Check environment variables
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }

  // 2. Dynamic runtime detection for local vs deployed environment
  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location;
    // Local dev mode: if running frontend on Vite port (e.g. 5173 / 3000), target local Express backend port 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port !== '5000') {
        return 'http://localhost:5000';
      }
      return '';
    }
  }

  // 3. Fallback: configured cloud production backend URL
  return 'https://task-1-zih4.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Robust API fetch wrapper with network error catching and JSON request/response defaults
 * @param {string} endpoint - API path (e.g. '/api/auth/login' or '/api/auth/signup')
 * @param {Object} options - fetch options
 */
export const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: options.credentials || 'include',
    });

    return response;
  } catch (error) {
    console.error(`Network error fetching ${url}:`, error);
    // Intercept raw network failures (e.g., server offline, CORS block, DNS error)
    // Return a structured response object with user-friendly error message
    return {
      ok: false,
      status: 0,
      statusText: 'Network Error',
      json: async () => ({
        error: 'Unable to connect to the backend server. Please verify server status or network connection.',
      }),
    };
  }
};

export default apiFetch;
