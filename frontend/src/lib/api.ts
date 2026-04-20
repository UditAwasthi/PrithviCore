import axios, { AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// Base URL — Always point directly to the Render backend.
// withCredentials + cross-origin requires an explicit URL (not relative '').
// Relative paths only work if you have Next.js rewrites configured, which
// also breaks cookie SameSite rules for cross-origin requests.
// ---------------------------------------------------------------------------
const API_URL = 'https://agridrishti-project.onrender.com';

// ---------------------------------------------------------------------------
// Token helpers — localStorage is only available in the browser.
// ---------------------------------------------------------------------------
export const tokenHelpers = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('prithvi_token');
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('prithvi_token', token);
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('prithvi_token');
  },
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for cross-origin httpOnly cookies
});

// Attach JWT Bearer token on every request (fallback alongside httpOnly cookie).
// The backend auth middleware accepts EITHER the cookie OR the Authorization header,
// so this ensures auth works even if the cookie is blocked cross-origin.
api.interceptors.request.use((config) => {
  const token = tokenHelpers.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Store token from login/signup responses into localStorage
api.interceptors.response.use(
  (res) => {
    // Backend returns { token, user } — store it for the Bearer fallback above
    const token = res.data?.token;
    if (token) {
      tokenHelpers.set(token);
    }
    return res;
  },
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      tokenHelpers.remove();
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
  login:       (data: LoginPayload)  => api.post('/auth/login', data),
  signup:      (data: SignupPayload) => api.post('/auth/signup', data),
  googleLogin: (credential: string)  => api.post('/auth/google', { credential }),
  guestLogin:  ()                    => api.post('/auth/guest'),
  sendOtp:     (phone: string)       => api.post('/auth/send-otp', { phone }),
  verifyOtp:   (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  me:          ()                    => api.get('/auth/me'),
  logout:      ()                    => api.post('/auth/logout'),
  profile:     (data: object)        => api.put('/auth/profile', data),
  password:    (data: object)        => api.put('/auth/password', data),
};

export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

export const sensorAPI = {
  latest:  ()                => api.get('/soil/latest'),
  history: (params?: object) => api.get('/soil/history', { params }),
  stats:   ()                => api.get('/sensor/stats'),
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

export const aiAnalysisAPI = {
  analyze: (data?: object) => api.post('/ai-analysis', data || {}),
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

export interface FeedbackPayload {
  category: 'bug' | 'feature' | 'improvement' | 'general';
  rating: number;
  subject: string;
  message: string;
}

export const feedbackAPI = {
  submit: (data: FeedbackPayload) => api.post('/feedback', data),
  history: ()                     => api.get('/feedback'),
};

export default api;