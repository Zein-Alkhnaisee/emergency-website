// src/services/ratingsApi.js
import { request } from './api';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ratingsRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  const headers = { Accept: 'application/json' };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || `Error ${res.status}`);
  return data;
};

export const ratingsApi = {
  // ─── 1. View ──────────────────────────────────────────────
  /**
   * جلب تقييمات مستخدم معين داخل غروب
   * @param {string} token
   * @param {string|number} userId - المستخدم المراد عرض تقييماته
   * @param {string|number} groupId - رقم الغروب (مطلوب)
   * @param {number} page - رقم الصفحة
   * @returns {Promise<{data: Array, meta: Object}>}
   */
  getUserRatings: (token, userId, groupId, page = 1) =>
    ratingsRequest(`/emergency/ratings/users/${userId}?group_id=${groupId}&page=${page}`, 'GET', null, token),

  /**
   * جلب التقييمات التي أرسلها المستخدم الحالي
   * @param {string} token
   * @param {string|number} groupId - اختياري (إذا لم تحدد، تجلب كل المجموعات)
   * @param {number} page
   * @returns {Promise<{data: Array, meta: Object}>}
   */
  getMyGivenRatings: (token, groupId = null, page = 1) => {
    let url = '/emergency/ratings/my/given?page=' + page;
    if (groupId) url += `&group_id=${groupId}`;
    return ratingsRequest(url, 'GET', null, token);
  },

  /**
   * جلب إحصاءات تقييم المستخدم الحالي داخل غروب
   * @param {string} token
   * @param {string|number} groupId - مطلوب
   * @returns {Promise<{data: {user: Object, group: Object, total: number, positive: number, negative: number, positive_percent: number, qualifies_admin: boolean}}>}
   */
  getMyStats: (token, groupId) =>
    ratingsRequest(`/emergency/ratings/my/stats?group_id=${groupId}`, 'GET', null, token),

  // ─── 2. Create & Update ────────────────────────────────────
  /**
   * تقييم مستخدم (إنشاء أو تحديث)
   * @param {string} token
   * @param {string|number} groupId
   * @param {string|number} ratedId - المستخدم الذي يتم تقييمه
   * @param {string} score - 'positive' أو 'negative'
   * @returns {Promise<{data: Object}>}
   */
  rateUser: (token, groupId, ratedId, score) =>
    ratingsRequest('/emergency/ratings', 'POST', { group_id: groupId, rated_id: ratedId, score }, token),

  /**
   * تعديل تقييم موجود
   * @param {string} token
   * @param {string|number} ratingId - معرف التقييم
   * @param {string} score - 'positive' أو 'negative'
   * @returns {Promise<{data: Object}>}
   */
  editRating: (token, ratingId, score) =>
    ratingsRequest(`/emergency/ratings/${ratingId}`, 'PATCH', { score }, token),

  /**
   * حذف تقييم
   * @param {string} token
   * @param {string|number} ratingId
   * @returns {Promise<{message: string}>}
   */
  deleteRating: (token, ratingId) =>
    ratingsRequest(`/emergency/ratings/${ratingId}`, 'DELETE', null, token),

  // ─── 3. Settings ────────────────────────────────────────────
  /**
   * تحديث إعدادات السماح بالتقييم
   * @param {string} token
   * @param {boolean} isRatable
   * @returns {Promise<{data: Object}>}
   */
  updateRatable: (token, isRatable) =>
    ratingsRequest('/emergency/ratings/my/ratable', 'PATCH', { is_ratable: isRatable }, token),
};