const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  GET_ME: `${API_BASE_URL}/auth/me`,
  
  // Reports
  REPORTS: `${API_BASE_URL}/reports`,
  REPORT_STATUS: (id) => `${API_BASE_URL}/reports/${id}/status`,
  
  // Users
  USERS: `${API_BASE_URL}/users`,
};

export default API_BASE_URL;
