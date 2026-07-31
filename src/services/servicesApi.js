// src/services/servicesApi.js
import { request } from './api';

// ─── Services ─────────────────────────────────────────────
export const submitService = (token, formData) =>
  request('/services', 'POST', formData, token);

export const getMyServices = (token) =>
  request('/services/my', 'GET', null, token);

export const updateService = (token, serviceId, formData) =>
  request(`/services/${serviceId}`, 'PATCH', formData, token);

export const getHomeGroupServices = (token) =>
  request('/services/home', 'GET', null, token);

export const listCategories = (token) =>
  request('/services/categories', 'GET', null, token);

export const listCities = (token) =>
  request('/services/cities', 'GET', null, token);

export const getServicesByCity = (token, city) =>
  request(`/services/cities/${encodeURIComponent(city)}/services`, 'GET', null, token);

export const getNearbyServices = (token, latitude, longitude) =>
  request(`/services?latitude=${latitude}&longitude=${longitude}`, 'GET', null, token);

export const discoverServices = (token, latitude, longitude) =>
  request(`/services/discover?latitude=${latitude}&longitude=${longitude}`, 'GET', null, token);

export const getUserServices = (token, userId) =>
  request(`/services/users/${userId}`, 'GET', null, token);

// ─── Bookings ─────────────────────────────────────────────
export const bookService = (token, serviceId, bookingData) =>
  request(`/services/${serviceId}/bookings`, 'POST', bookingData, token);

export const getMyBookings = (token) =>
  request('/services/bookings/my', 'GET', null, token);

export const getReceivedBookings = (token) =>
  request('/services/bookings/received', 'GET', null, token);

export const approveBooking = (token, bookingId) =>
  request(`/services/bookings/${bookingId}/approve`, 'POST', null, token);

export const rejectBooking = (token, bookingId, reason) =>
  request(`/services/bookings/${bookingId}/reject`, 'POST', { rejection_reason: reason }, token);

export const completeBooking = (token, bookingId) =>
  request(`/services/bookings/${bookingId}/complete`, 'POST', null, token);

export const cancelBooking = (token, bookingId) =>
  request(`/services/bookings/${bookingId}/cancel`, 'POST', null, token);

// ─── Ratings ──────────────────────────────────────────────
export const rateService = (token, serviceId, groupId, score, review_text = '') =>
  request(`/services/${serviceId}/ratings`, 'POST', { group_id: groupId, score, review_text }, token);

export const updateServiceRating = (token, serviceId, ratingId, score, review_text = '') =>
  request(`/services/${serviceId}/ratings/${ratingId}`, 'PATCH', { score, review_text }, token);

export const deleteServiceRating = (token, serviceId, ratingId) =>
  request(`/services/${serviceId}/ratings/${ratingId}`, 'DELETE', null, token);

export const getServiceRatings = (token, serviceId, groupId) =>
  request(`/services/${serviceId}/ratings?group_id=${groupId}`, 'GET', null, token);

export const getServiceRatingStats = (token, serviceId, groupId) =>
  request(`/services/${serviceId}/ratings/stats?group_id=${groupId}`, 'GET', null, token);

