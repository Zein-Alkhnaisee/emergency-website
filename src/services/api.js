// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const request = async (endpoint, method = 'GET', body = null, token = null) => {
  const isFormData = body instanceof FormData;

  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // معالجة 404 كحالة طبيعية (لا يوجد طلب)
  if (res.status === 404) {
    const error = new Error('Not Found');
    error.status = 404;
    throw error;
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
  return data;
};