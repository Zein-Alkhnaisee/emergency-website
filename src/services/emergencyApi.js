const API_URL = import.meta.env.VITE_API_URL || '/api';

const emergencyRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  const isFormData = body instanceof FormData;
  const headers = { Accept: 'application/json' };
  if (!isFormData) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    let errorMessage = data.message || data.error || `خطأ ${res.status}`;
    if (data.errors && typeof data.errors === 'object') {
      const errorDetails = Object.values(data.errors).flat().join(', ');
      errorMessage = `${errorMessage}: ${errorDetails}`;
    }
    throw new Error(errorMessage);
  }
  return data;
};

/**
 * جلب إحصاءات مستخدم معين (المجموع، المتوسط، التوزيع)
 */
export const getUserStats = async (token, userId, groupId) => {
  const response = await fetch(`${API_URL}/ratings/stats/${userId}?group_id=${groupId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'فشل جلب إحصاءات المستخدم');
  }
  return data;
};

// ─── Role Requests ──────────────────────────
export const submitRoleRequest = (token, formData) => {
  return emergencyRequest('/role-requests', 'POST', formData, token);
};

export const getMyRoleRequests = (token) =>
  emergencyRequest('/role-requests/my', 'GET', null, token);

// ─── Emergency Groups ───────────────────────
export const searchGroups = (token, latitude, longitude, saveAsHome = false) =>
  emergencyRequest('/emergency/groups/join', 'POST', { latitude, longitude, save_as_home: saveAsHome }, token);

export const confirmOfficialJoin = (token, groupId, latitude, longitude) =>
  emergencyRequest(`/emergency/groups/${groupId}/join/confirm`, 'POST', { latitude, longitude }, token);

export const confirmPendingJoin = (token, pendingGroupId, latitude, longitude) =>
  emergencyRequest(`/emergency/pending-groups/${pendingGroupId}/join/confirm`, 'POST', { latitude, longitude }, token);

export const confirmCreateNewPending = (token, latitude, longitude) =>
  emergencyRequest('/emergency/pending-groups/join/confirm', 'POST', { latitude, longitude }, token);

export const saveHomeLocation = (token, homeLat, homeLng) =>
  emergencyRequest('/emergency/profile/home-location', 'POST', { home_lat: homeLat, home_lng: homeLng }, token);

export const getMyGroup = (token) =>
  emergencyRequest('/emergency/my-group', 'GET', null, token);

// ─── Emergency SOS ──────────────────────────
export const sendSOS = (token, case_type, custom_text, severity, location_lat, location_lng) =>
  emergencyRequest('/emergency/sos', 'POST', { case_type, custom_text, severity, location_lat, location_lng }, token);

export const retryMyCase = (token) =>
  emergencyRequest('/emergency/my-case/retry', 'POST', null, token);

// ─── Emergency Notifications ────────────────
export const getMyNotifications = (token, perPage = 15) => {
  return emergencyRequest(`/emergency/notifications?per_page=${perPage}`, 'GET', null, token)
    .then((data) => {
      return data;
    })
    .catch((err) => {
      console.error('❌ getMyNotifications error:', err);
      throw err;
    });
};

export const respondToNotification = (token, notifId, response) =>
  emergencyRequest(`/emergency/notifications/${notifId}/respond`, 'POST', { response }, token);

// ─── Emergency Cases ─────────────────────────
export const getMyActiveCase = async (token) => {
  const response = await fetch(`${API_URL}/emergency/my-case`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || `Error ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const resolveMyCase = (token) =>
  emergencyRequest('/emergency/my-case/resolve', 'POST', null, token);

export const getCaseDetail = (token, emergencyId) =>
  emergencyRequest(`/emergency/cases/${emergencyId}`, 'GET', null, token);

export const resolveCase = (token, emergencyId) =>
  emergencyRequest(`/emergency/cases/${emergencyId}/resolve`, 'POST', null, token);

// ─── Emergency Chat ──────────────────────────
export const getChatMessages = (token, context, perPage = 20, page = 1) =>
  emergencyRequest(`/emergency/chat?context=${context}&per_page=${perPage}&page=${page}`, 'GET', null, token);

export const sendChatMessage = (token, context, content) =>
  emergencyRequest('/emergency/chat', 'POST', { context, content }, token);

export const listChats = (token) =>
  emergencyRequest('/emergency/chats', 'GET', null, token);

export const sendTypingIndicator = (token, context, typing) =>
  emergencyRequest('/emergency/chat/typing', 'POST', { context, typing }, token);

export const sendPresenceHeartbeat = (token, context) =>
  emergencyRequest('/emergency/chat/presence', 'POST', { context }, token);

export const markChatRead = (token, context, messageIds) =>
  emergencyRequest('/emergency/chat/mark-read', 'POST', { context, message_ids: messageIds }, token);

// ─── Group Members ───────────────────────────
export const getHomeGroupMembers = (token) =>
  emergencyRequest('/emergency/my-group/members', 'GET', null, token);

export const getGuestGroupMembers = (token) =>
  emergencyRequest('/emergency/guest-group/members', 'GET', null, token);

export const sendChatMessageWithAttachment = (token, context, content, attachmentFile) => {
  const formData = new FormData();
  formData.append('context', context);
  if (content) formData.append('content', content);
  if (attachmentFile) formData.append('attachment', attachmentFile);
  return emergencyRequest('/emergency/chat', 'POST', formData, token);
};

// ─── Ratings ─────────────────────────────────
export const getUserRatings = (token, userId, groupId, page = 1, perPage = 15) =>
  emergencyRequest(`/emergency/ratings/users/${userId}?group_id=${groupId}&page=${page}&per_page=${perPage}`, 'GET', null, token);

export const getMyGivenRatings = (token, groupId = null, page = 1, perPage = 15) => {
  let url = `/emergency/ratings/my/given?page=${page}&per_page=${perPage}`;
  if (groupId) url += `&group_id=${groupId}`;
  return emergencyRequest(url, 'GET', null, token);
};

export const getMyRatingStats = (token, groupId) =>
  emergencyRequest(`/emergency/ratings/my/stats?group_id=${groupId}`, 'GET', null, token);

export const createRating = (token, groupId, ratedId, score) =>
  emergencyRequest('/emergency/ratings', 'POST', { group_id: groupId, rated_id: ratedId, score }, token);

export const updateRating = (token, ratingId, score) =>
  emergencyRequest(`/emergency/ratings/${ratingId}`, 'PATCH', { score }, token);

export const deleteRating = (token, ratingId) =>
  emergencyRequest(`/emergency/ratings/${ratingId}`, 'DELETE', null, token);

export const toggleRatable = (token, isRatable) =>
  emergencyRequest('/emergency/ratings/my/ratable', 'PATCH', { is_ratable: isRatable }, token);

export const getUserNotifications = (token, perPage = 50) =>
  emergencyRequest(`/user-notifications?per_page=${perPage}`, 'GET', null, token);

export const markAllNotificationsRead = (token) =>
  emergencyRequest('/user-notifications/mark-all-read', 'POST', null, token);

// ─── Rescue Requests ─────────────────────────
export const getRescueRequests = (token, params = {}) => {
  const { perPage = 15, page = 1, pending = false, active = false, status = null, status_group = null } = params;
  let query = `?per_page=${perPage}&page=${page}`;
  if (pending) query += '&pending=1';
  if (active) query += '&active=1';
  if (status) query += `&status=${status}`;
  if (status_group) query += `&status_group=${status_group}`;
  return emergencyRequest(`/emergency/rescue-requests${query}`, 'GET', null, token);
};

export const getRescueRequestDetail = (token, emergencyId) =>
  emergencyRequest(`/emergency/rescue-requests/${emergencyId}`, 'GET', null, token);

export const acceptRescueRequest = (token, emergencyId) =>
  emergencyRequest(`/emergency/rescue-requests/${emergencyId}/accept`, 'POST', null, token);

export const rejectRescueRequest = (token, emergencyId) =>
  emergencyRequest(`/emergency/rescue-requests/${emergencyId}/reject`, 'POST', null, token);

// ─── User Notifications ──────────────────────
export const getUserNotificationsList = (token, perPage = 20) =>
  emergencyRequest(`/user-notifications?per_page=${perPage}`, 'GET', null, token);

export const getUnreadNotificationsCount = (token) =>
  emergencyRequest('/user-notifications/unread-count', 'GET', null, token);

export const markNotificationRead = (token, notificationId) =>
  emergencyRequest(`/user-notifications/${notificationId}/read`, 'PATCH', null, token);

// ─── My Active Status ────────────────────────
export const getMyActiveStatus = (token) =>
  emergencyRequest('/emergency/my-active-status', 'GET', null, token);

// ─── My Participations ───────────────────────
export const getMyParticipations = (token, params = {}) => {
  const { perPage = 15, page = 1, status, status_group } = params;
  let query = `?per_page=${perPage}&page=${page}`;
  if (status) query += `&status=${status}`;
  if (status_group) query += `&status_group=${status_group}`;
  return emergencyRequest(`/emergency/my-participations${query}`, 'GET', null, token);
};

// ─── Explore ──────────────────────────────────
export const getExploreCases = (token, params = {}) => {
  const { perPage = 15, page = 1, status, status_group } = params;
  let query = `?per_page=${perPage}&page=${page}`;
  if (status) query += `&status=${status}`;
  if (status_group) query += `&status_group=${status_group}`;
  return emergencyRequest(`/emergency/explore${query}`, 'GET', null, token);
};

// ─── Availability ────────────────────────────
export const getMyAvailability = (token) =>
  emergencyRequest('/emergency/my-availability', 'GET', null, token);

export const updateMyAvailability = (token, available) =>
  emergencyRequest('/emergency/my-availability', 'PATCH', { available_for_emergency: available }, token);

// ─── Reports ──────────────────────────────────
/**
 * إنشاء بلاغ جديد
 * POST /emergency/reports
 */
export const submitReport = (token, data) => {
  return emergencyRequest('/emergency/reports', 'POST', data, token);
};

/**
 * جلب بلاغاتي
 * GET /emergency/reports/my
 */
export const getMyReports = (token, params = {}) => {
  const { perPage = 15, page = 1, status = null, report_type = null } = params;
  let query = `?per_page=${perPage}&page=${page}`;
  if (status) query += `&status=${status}`;
  if (report_type) query += `&report_type=${report_type}`;
  return emergencyRequest(`/emergency/reports/my${query}`, 'GET', null, token);
};

/**
 * حذف بلاغ
 * DELETE /emergency/reports/{id}
 */
export const deleteReport = (token, reportId) => {
  return emergencyRequest(`/emergency/reports/${reportId}`, 'DELETE', null, token);
};