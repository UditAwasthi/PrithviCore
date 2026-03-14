import axios, { AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// Base URL — reads NEXT_PUBLIC_API_URL set in .env.local or Vercel dashboard.
// Falls back to the Render backend so the app still works without a local .env
// ---------------------------------------------------------------------------
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://agridrishti-project.onrender.com';

// ---------------------------------------------------------------------------
// Token helpers — localStorage is only available in the browser.
// All reads/writes are guarded with typeof window checks so Next.js SSR
// doesn't throw during the server-side build step.
// ---------------------------------------------------------------------------
export const tokenHelpers = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('agri_token');
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('agri_token', token);
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('agri_token');
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every outgoing request
api.interceptors.request.use((config) => {
  const token = tokenHelpers.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — clear token and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      tokenHelpers.remove();
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/signup')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ---------------------------------------------------------------------------
// Typed API surface
// ---------------------------------------------------------------------------

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  farm_size_acres?: number;
  farm_location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

export const authAPI = {
  login:    (data: LoginPayload)  => api.post('/auth/login', data),
  signup:   (data: SignupPayload) => api.post('/auth/signup', data),
  me:       ()                    => api.get('/auth/me'),
  profile:  (data: object)        => api.put('/auth/profile', data),
  password: (data: object)        => api.put('/auth/password', data),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const sensorAPI = {
  latest:  ()               => api.get('/soil/latest'),
  history: (params?: object) => api.get('/soil/history', { params }),
  stats:   ()               => api.get('/sensor/stats'),
};

export const diseaseAPI = {
  detect: (formData: FormData) =>
    api.post('/disease-detection', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    }),
  history: (params?: object) => api.get('/disease-history', { params }),
};

export const recommendationsAPI = {
  get: () => api.get('/recommendations'),
};

export const weatherAPI = {
  get: (params?: object) => api.get('/weather', { params }),
};

export const reportsAPI = {
  get:      (params?: object) => api.get('/reports', { params }),
  download: (type: string)    =>
    api.get('/reports/download', {
      params: { type },
      responseType: 'blob',
      timeout: 60_000,
    }),
};

export default api;

