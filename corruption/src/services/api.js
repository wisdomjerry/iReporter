import axios from "axios";
import API_BASE_URL from "../config/api";

const AUTH_URL = "/auth";
const REPORTS_URL = "/reports";
const USERS_URL = "/users";
const NOTIFICATIONS_URL = "/notifications";

const API_URL = process.env.REACT_APP_API_URL;

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const apiService = {
  // --- Generic helpers ---
  get: async (url, params) => (await api.get(url, { params })).data,
  post: async (url, data) => (await api.post(url, data)).data,
  put: async (url, data) => (await api.put(url, data)).data,
  patch: async (url, data) => (await api.patch(url, data)).data,
  delete: async (url) => (await api.delete(url)).data,

  // --- Auth ---
  register: (userData) => apiService.post(`${AUTH_URL}/register`, userData),
  login: async (email, password) => {
    const res = await apiService.post(`${AUTH_URL}/login`, { email, password });
    if (res.token) localStorage.setItem("token", res.token);
    return res;
  },
  getCurrentUser: () => apiService.get(`${AUTH_URL}/me`),
  logout: async () => {
    localStorage.removeItem("token");
    return { message: "Logged out" };
  },
  // --- Auth ---
  markFirstLoginShown: () =>
  apiService.put(`${AUTH_URL}/first-login-seen`, { firstLoginShown: true }),


  // --- Reports ---
  getReports: (userId, options = {}) => {
    let url = `${REPORTS_URL}`;
    if (userId) url += `?userId=${userId}`;
    if (options.minimal) url += userId ? "&minimal=true" : "?minimal=true";
    return apiService.get(url);
  },

  getUserReports: async () => {
    const token = localStorage.getItem("token"); // or wherever you store it
    const response = await axios.get(`${API_URL}/reports`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
  createReport: (data) => apiService.post(REPORTS_URL, data),
  updateReport: (id, data) => apiService.put(`${REPORTS_URL}/${id}`, data),
  updateReportStatus: (id, status) =>
    apiService.put(`${REPORTS_URL}/${id}/status`, { status }),
  deleteReport: (id) => apiService.delete(`${REPORTS_URL}/${id}`),

  // --- Users ---
  getUsers: () => apiService.get(USERS_URL),

  // --- Profile (new endpoints) ---
  getProfile: () => apiService.get(`${USERS_URL}/profile`),
  updateProfile: (formData) =>
    api.put(`${USERS_URL}/profile`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    }),

  changePassword: (currentPassword, newPassword) =>
    apiService.put(`${USERS_URL}/password`, { currentPassword, newPassword }),

  // --- Notifications ---
  getNotifications: async () => {
    const res = await api.get(NOTIFICATIONS_URL); // GET /notifications
    return res.data.notifications; // return the array directly
  },
  createNotification: (data) => apiService.post(NOTIFICATIONS_URL, data),
  markNotificationRead: (id) =>
    apiService.put(`${NOTIFICATIONS_URL}/${id}/read`), // use PUT for marking single
  markAllNotificationsRead: () =>
    apiService.put(`${NOTIFICATIONS_URL}/mark-all-read`), // new endpoint
  deleteNotification: (id) => apiService.delete(`${NOTIFICATIONS_URL}/${id}`),
  deleteAllNotifications: async () => {
    const all = await apiService.get(NOTIFICATIONS_URL);
    await Promise.all(
      all.notifications.map((n) =>
        apiService.delete(`${NOTIFICATIONS_URL}/${n.id}`)
      )
    );
    return { success: true };
  },
};

export default apiService;
