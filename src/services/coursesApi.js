// src/services/coursesApi.js
import { request } from './api';

// ─── Public endpoints ────────────────────────────────────────────

export const getCategories = () =>
  request('/courses/categories', 'GET');

export const getCourses = (categoryId = null, page = 1, perPage = 10) => {
  let url = `/courses?page=${page}&per_page=${perPage}`;
  if (categoryId && categoryId !== 'all') url += `&category_id=${categoryId}`;
  return request(url, 'GET');
};

export const getCourse = (courseId) =>
  request(`/courses/${courseId}`, 'GET');

export const getCourseRatings = (courseId) =>
  request(`/courses/${courseId}/ratings`, 'GET');

export const getCourseRatingStats = (courseId) =>
  request(`/courses/${courseId}/ratings/stats`, 'GET');

// ─── Authenticated (Trusted) ────────────────────────────────────

export const rateCourse = (token, courseId, score, review_text = '') =>
  request(`/courses/${courseId}/ratings`, 'POST', { score, review_text }, token);

export const updateCourseRating = (token, courseId, ratingId, score, review_text = '') =>
  request(`/courses/${courseId}/ratings/${ratingId}`, 'PATCH', { score, review_text }, token);

export const deleteCourseRating = (token, courseId, ratingId) =>
  request(`/courses/${courseId}/ratings/${ratingId}`, 'DELETE', null, token);