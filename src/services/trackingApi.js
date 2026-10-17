// src/services/trackingApi.js
import { request } from './api';

/**
 * قبول طلب الإنقاذ مع origin
 * POST /emergency/rescue-requests/{emergency}/accept
 */
export const acceptRescueWithOrigin = (emergencyId, body, token) => {
  return request(`/emergency/rescue-requests/${emergencyId}/accept`, 'POST', body, token);
};

/**
 * تسجيل origin فقط (مسار الاسترداد)
 * POST /emergency/cases/{emergency}/tracking/origin
 */
export const recordOrigin = (emergencyId, originData, token) => {
  return request(`/emergency/cases/${emergencyId}/tracking/origin`, 'POST', originData, token);
};

/**
 * إرسال ping (تحديث الموقع الدوري)
 * POST /emergency/cases/{emergency}/tracking/ping
 */
export const sendPing = (emergencyId, pingData, token) => {
  return request(`/emergency/cases/${emergencyId}/tracking/ping`, 'POST', pingData, token);
};

/**
 * جلب لقطة التتبع الحالية (جميع المنقذين)
 * GET /emergency/cases/{emergency}/tracking
 */
export const getTrackingSnapshot = (emergencyId, token) => {
  return request(`/emergency/cases/${emergencyId}/tracking`, 'GET', null, token);
};

/**
 * جلب المسار التاريخي لمنقذ معين
 * GET /emergency/cases/{emergency}/tracking/trail?user_id={userId}
 */
export const getRescuerTrail = (emergencyId, userId, token, limit = 500, since = null, until = null, cursor = null) => {
  let url = `/emergency/cases/${emergencyId}/tracking/trail?user_id=${userId}&limit=${limit}`;
  if (since) url += `&since=${encodeURIComponent(since)}`;
  if (until) url += `&until=${encodeURIComponent(until)}`;
  if (cursor) url += `&cursor=${cursor}`;
  return request(url, 'GET', null, token);
};