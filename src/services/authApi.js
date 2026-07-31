// src/services/authApi.js
import { request } from './api';

export const authApi = {
  login: (credentials) => request('/auth/login', 'POST', credentials),
  register: (userData) => request('/auth/register', 'POST', userData),
  logout: (token) => request('/auth/logout', 'POST', null, token),
  forgotPassword: (email) => request('/auth/password/forgot', 'POST', { email }),
  verifyOTP: (temp_token, otp_code) => request('/auth/password/verify', 'POST', { temp_token, otp_code }),
  resetPassword: (temp_token, password, password_confirmation) => request('/auth/password/reset', 'POST', { temp_token, password, password_confirmation }),
  resendOTP: (temp_token) => request('/auth/resend', 'POST', { temp_token }),
  verifyEmailCode: (temp_token, verification_code) => request('/auth/verify-code', 'POST', { temp_token, verification_code }),
  getMe: (token) => request('/auth/me', 'GET', null, token),
};