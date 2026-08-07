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
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Retrieve token from localStorage
  const token = localStorage.getItem('token');
  const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...authHeaders,
        ...options.headers,
      },
      credentials: options.credentials || 'include',
    });

    const originalJson = response.json.bind(response);
    response.json = async () => {
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        try {
          const text = await response.text();
          console.warn(`Non-JSON response (${response.status}) from ${url}:`, text.substring(0, 150));
        } catch {}
        if (response.status === 404) {
          return { error: `API endpoint not found (404). Please verify backend server route.` };
        }
        if (response.status >= 500) {
          return { error: `Server error occurred (${response.status}). Please try again later.` };
        }
        return { error: response.ok ? 'Server returned non-JSON format' : `Server error (${response.status}).` };
      }
      try {
        return await originalJson();
      } catch (err) {
        console.error(`JSON parse error from ${url}:`, err);
        return { error: 'Unable to parse server response as JSON' };
      }
    };

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

/**
 * Send OTP to user's email via Hostinger/Gmail SMTP
 * @param {string} email
 * @param {string} [reason] - e.g. 'verification' or 'password-reset'
 */
export const sendOtp = async (email, reason = 'verification') => {
  return apiFetch('/api/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, reason }),
  });
};

/**
 * Verify OTP entered by user
 * @param {string} email
 * @param {string} otp - 6-digit OTP code
 */
export const verifyOtp = async (email, otp) => {
  return apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
};

/**
 * Reset password with verified OTP code
 * @param {string} email
 * @param {string} otp - 6-digit OTP code
 * @param {string} password - New password
 */
export const resetPassword = async (email, otp, password) => {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, password }),
  });
};

export default apiFetch;
