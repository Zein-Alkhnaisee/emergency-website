// src/services/trustApi.js
import { request } from './api';

export const trustApi = {
  getMyVerification: (token) =>
    request('/trust-verification/me', 'GET', null, token),

  submitVerification: (formData, token) =>
    request('/trust-verification', 'POST', formData, token),

  updateVerification: (formData, token) =>
    request('/trust-verification/me', 'POST', formData, token),

  deleteVerification: (token) =>
    request('/trust-verification/me', 'DELETE', null, token),

  getNotifications: (token) =>
    request('/user-notifications', 'GET', null, token),

  markNotificationRead: (notificationId, token) =>
    request(`/user-notifications/${notificationId}/read`, 'PATCH', null, token),
};