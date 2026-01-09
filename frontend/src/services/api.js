import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
  createAdmin: (data) => api.post('/auth/admin', data),
};

// Projects API
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getOne: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
};

// Subscriptions API
export const subscriptionsAPI = {
  create: (data) => api.post('/subscriptions', data),
  getAll: (params) => api.get('/subscriptions', { params }),
  getOne: (id) => api.get(`/subscriptions/${id}`),
  update: (id, data) => api.put(`/subscriptions/${id}`, data),
  pause: (id) => api.post(`/subscriptions/${id}/pause`),
  resume: (id) => api.post(`/subscriptions/${id}/resume`),
  cancel: (id) => api.post(`/subscriptions/${id}/cancel`),
  getAllAdmin: (params) => api.get('/subscriptions/admin/all', { params }),
};

// Payments API
export const paymentsAPI = {
  verify: (reference) => api.get('/payments/verify', { params: { reference } }),
  getAll: (params) => api.get('/payments', { params }),
  getAllAdmin: (params) => api.get('/payments/admin/all', { params }),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDonors: (params) => api.get('/admin/donors', { params }),
  getDonorDetails: (id) => api.get(`/admin/donors/${id}`),
  toggleDonorStatus: (id) => api.put(`/admin/donors/${id}/toggle-status`),
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
