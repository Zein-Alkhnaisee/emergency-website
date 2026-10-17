// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || '/api';

const RETRY_COUNT = 3;
const RETRY_DELAY = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const request = async (endpoint, method = 'GET', body = null, token = null, retries = RETRY_COUNT) => {
  const isFormData = body instanceof FormData;

  const headers = {
    Accept: 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
  };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
    });

    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      const error = new Error('Unauthorized - Please login again.');
      error.status = 401;
      throw error;
    }

    if (res.status === 404) {
      const error = new Error('Not Found');
      error.status = 404;
      throw error;
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const error = new Error('Unexpected response format from server.');
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.message || data.error || `Error ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  } catch (error) {
    const isJsonError = error.message && error.message.includes('Unexpected token');
    if (retries > 0 && error.status !== 401 && error.status !== 403 && error.status !== 404 && error.status !== 429 && !isJsonError) {
      const delay = RETRY_DELAY * (RETRY_COUNT - retries + 1);
      console.warn(`🔄 Retrying request to ${endpoint} (${retries} attempts left) after ${delay}ms`);
      await sleep(delay);
      return request(endpoint, method, body, token, retries - 1);
    }
    throw error;
  }
};