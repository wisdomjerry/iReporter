import axios from "axios";
import API_BASE_URL from "../config/api";

const AUTH_URL = "/auth";
const REPORTS_URL = "/reports";
const USERS_URL = "/users";
const NOTIFICATIONS_URL = "/notifications";

// ─── Axios instance ───────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // REQUIRED for cookies
});

// ─── Generic helpers ──────────────────────────────
const apiService = {
  get: async (url, params) => (await api.get(url, { params })).data,
  post: async (url, data) => (await api.post(url, data)).data,
  put: async (url, data) => (await api.put(url, data)).data,
  patch: async (url, data) => (await api.patch(url, data)).data,
  delete: async (url) => (await api.delete(url)).data,

  // ─── AUTH ───────────────────────────────────────
  register: (userData) =>
    api.post(`${AUTH_URL}/register`, userData).then((res) => res.data),

  login: (email, password) =>
    api.post(`${AUTH_URL}/login`, { email, password }).then((res) => res.data),

  getCurrentUser: () =>
    api.get(`${AUTH_URL}/me`).then((res) => res.data),

  logout: () =>
    api.post(`${AUTH_URL}/logout`).then((res) => res.data),

  // ✅ CORRECT first login update
  markFirstLoginShown: () =>
    api.put(`${USERS_URL}/first-login-shown`).then((res) => res.data),

  // ─── REPORTS ────────────────────────────────────
  getReports: (userId, options = {}) => {
    let url = REPORTS_URL;
    if (userId) url += `?userId=${userId}`;
    if (options.minimal) url += userId ? "&minimal=true" : "?minimal=true";
    return apiService.get(url);
  },

  createReport: (data) => apiService.post(REPORTS_URL, data),
  updateReport: (id, data) =>
    apiService.put(`${REPORTS_URL}/${id}`, data),

  updateReportStatus: (id, status) =>
    apiService.put(`${REPORTS_URL}/${id}/status`, { status }),

  deleteReport: (id) =>
    apiService.delete(`${REPORTS_URL}/${id}`),

  // ─── USERS / PROFILE ────────────────────────────
  getUsers: () => apiService.get(USERS_URL),

  getProfile: () =>
    apiService.get(`${USERS_URL}/profile`),

  // ✅ DO NOT set Content-Type manually
  updateProfile: (formData) =>
    api.put(`${USERS_URL}/profile`, formData),

  changePassword: (currentPassword, newPassword) =>
    apiService.put(`${USERS_URL}/password`, {
      currentPassword,
      newPassword,
    }),

  // ─── NOTIFICATIONS ──────────────────────────────
  getNotifications: async () => {
    const res = await api.get(NOTIFICATIONS_URL);
    return res.data.notifications;
  },

  markNotificationRead: (id) =>
    apiService.put(`${NOTIFICATIONS_URL}/${id}/read`),

  markAllNotificationsRead: () =>
    apiService.put(`${NOTIFICATIONS_URL}/mark-all-read`),

  deleteNotification: (id) =>
    apiService.delete(`${NOTIFICATIONS_URL}/${id}`),
};

export default apiService;
