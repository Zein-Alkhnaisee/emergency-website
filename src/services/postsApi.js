// src/services/postsApi.js
import { request } from './api';


export const postsApi = {
  // ─── 🌐 Guest ──────────────────────────────────────────
  getArticles: (page = 1, perPage = 10, search = '') => {
    let url = `/articles?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return request(url);
  },

  getArticleById: (id) =>
    request(`/articles/${id}`),

  getUserArticles: (userId, page = 1, perPage = 10) =>
    request(`/users/${userId}/articles?page=${page}&per_page=${perPage}`),

  getArticleComments: (articleId, page = 1) =>
    request(`/articles/${articleId}/comments?page=${page}`),

  getArticleReactions: (articleId, perPage = 20, type = null) =>
    request(`/articles/${articleId}/reactions?per_page=${perPage}${type ? `&type=${type}` : ''}`),

  getCommentReactions: (commentId, perPage = 20, type = null) =>
    request(`/comments/${commentId}/reactions?per_page=${perPage}${type ? `&type=${type}` : ''}`),

  // ─── 🔑 Member (requires token) ────────────────────────
  addComment: (articleId, content, token) =>
    request(`/articles/${articleId}/comments`, 'POST', { content }, token),

  editComment: (commentId, content, token) =>
    request(`/comments/${commentId}`, 'PUT', { content }, token),

  deleteComment: (commentId, token) =>
    request(`/comments/${commentId}`, 'DELETE', null, token),

  reactToArticle: (articleId, type, token) =>
    request('/reactions', 'POST', { reactionable_type: 'article', reactionable_id: articleId, type }, token),

  reactToComment: (commentId, type, token) =>
    request('/reactions', 'POST', { reactionable_type: 'comment', reactionable_id: commentId, type }, token),

  getMyComments: (token, perPage = 20) =>
    request(`/profile/comments?per_page=${perPage}`, 'GET', null, token),

  getMyReactions: (token, perPage = 20, type = null) =>
    request(`/profile/reactions?per_page=${perPage}${type ? `&type=${type}` : ''}`, 'GET', null, token),

  // ─── ✅ Trusted (requires token + trusted role) ─────────
  getMyArticles: (token, status = null, page = 1, perPage = 15) =>
    request(`/profile/articles?page=${page}&per_page=${perPage}${status ? `&status=${status}` : ''}`, 'GET', null, token),

  createArticle: (formData, token) =>
    request('/articles', 'POST', formData, token),

  updateArticle: (articleId, formData, token) =>
    request(`/articles/${articleId}`, 'POST', formData, token),

  deleteArticleSoft: (articleId, token) =>
    request(`/articles/${articleId}`, 'DELETE', null, token),

  getTrashedArticles: (token, page = 1) =>
    request(`/articles/trash?page=${page}`, 'GET', null, token),

  restoreArticle: (articleId, token) =>
    request(`/articles/${articleId}/restore`, 'POST', null, token),

  forceDeleteArticle: (articleId, token) =>
    request(`/articles/${articleId}/force`, 'DELETE', null, token),
};