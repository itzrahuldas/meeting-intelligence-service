import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data).then((r) => r.data.data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data).then((r) => r.data.data),
};

// ─── Meetings ────────────────────────────────────────────────
export const meetingsApi = {
  list: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/api/meetings', { params }).then((r) => r.data.data),
  get: (id: string) => api.get(`/api/meetings/${id}`).then((r) => r.data.data),
  create: (data: {
    title: string;
    participants: string[];
    meetingDate: string;
    transcript: { speaker: string; text: string; timestamp: string }[];
  }) => api.post('/api/meetings', data).then((r) => r.data.data),
  analyze: (id: string) =>
    api.post(`/api/meetings/${id}/analyze`).then((r) => r.data.data),
};

// ─── Action Items ────────────────────────────────────────────
export const actionItemsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    assignee?: string;
    meetingId?: string;
  }) => api.get('/api/action-items', { params }).then((r) => r.data.data),
  getOverdue: () =>
    api.get('/api/action-items/overdue').then((r) => r.data.data),
  updateStatus: (id: string, status: string) =>
    api
      .patch(`/api/action-items/${id}/status`, { status })
      .then((r) => r.data.data),
  create: (data: {
    task: string;
    assignee: string;
    meetingId: string;
    dueDate?: string;
  }) => api.post('/api/action-items', data).then((r) => r.data.data),
};
